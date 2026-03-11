# P3 — Result Submission Pipeline (3-tier)
> **Senior Engineer Assessment** — Đọc kỹ trước khi code
> Cập nhật: 2026-03-08

---

## THỰC TẾ HIỆN TẠI (sau khi đọc source)

> Nhiều hơn dự kiến đã có — nhưng có critical bugs ngăn hoạt động.

### Đã có:

**Creator Backend (Rust)**:
- `network_commands.rs`: `start_receive_mode`, `stop_receive_mode`, `get_lan_server_status`, `get_local_ip` — **Implemented với Axum!**
- `network/server.rs`: Standalone `start_lan_server()` với mDNS advertisement — **Implemented!**
- `handle_post_result` + `handle_heartbeat` → emit Tauri events

**Player Backend (Rust)**:
- `network.rs`: `discover_lan_server()` (mDNS, 5s timeout), `send_result_http()`, `get_machine_id()` — **Implemented!**

### Bugs Nghiêm Trọng (blockers):

| # | Bug | Severity | Location |
|---|---|---|---|
| 1 | `SharedLanState` KHÔNG được `.manage()` trong lib.rs | 🔴 CRASH | `creator/src-tauri/src/lib.rs` |
| 2 | `stop_receive_mode` + `get_lan_server_status` KHÔNG đăng ký trong invoke_handler | 🔴 Không gọi được | `creator/src-tauri/src/lib.rs` |
| 3 | 2 server implementations song song: `network_commands.rs` (dùng) và `network/server.rs` (không dùng) — mDNS chỉ có trong `server.rs` | 🟠 mDNS không hoạt động | Cả 2 files |
| 4 | `network/server.rs` `start_lan_server()` không được gọi từ đâu | 🟠 Dead code | `network/server.rs` |
| 5 | `handle_post_result` không save vào SQLite — chỉ emit event | 🟠 Data lost | `network_commands.rs` |
| 6 | Player không có result submission code ở frontend | 🔴 Kết quả không gửi được | `player/src/` |
| 7 | Không có heartbeat sender ở player | 🟡 Monitor không có data | `player/src/` |
| 8 | `ReceiveMode.tsx` chưa listen Tauri events thật | 🟠 UI không update | `creator/src/pages/ReceiveMode.tsx` |
| 9 | `Dashboard.tsx` Monitor tab dùng mock data | 🟠 Không real-time | `creator/src/pages/Dashboard.tsx` |

---

## KIẾN TRÚC RESULT PIPELINE ĐẦY ĐỦ

```
PLAYER (khi nộp bài xong)
│
├─ Tier 1: HTTP POST → result_server_url (nếu được cấu hình)
│   ├─ Retry: 0s → +3s → +10s (3 lần)
│   └─ Nếu success → done ✅
│
├─ Tier 2: LAN Discovery + HTTP POST
│   ├─ mDNS: discover _quizforge._tcp.local (timeout 5s)
│   ├─ Nếu tìm thấy → POST http://{ip}:{port}/result
│   └─ Nếu success → done ✅
│
└─ Tier 3: Local File Fallback
    ├─ Save result_{name}_{timestamp}.json vào Desktop
    └─ Thông báo user: "Đã lưu local, đưa cho giáo viên"

CREATOR (nhận kết quả)
│
├─ HTTP Server (Axum, port cấu hình được, default 41235)
│   ├─ POST /result → validate + save SQLite + emit "result-received" event
│   ├─ POST /heartbeat → emit "heartbeat-received" event (10s interval)
│   └─ GET /health → { status: "ok" }
│
├─ mDNS Advertisement: _quizforge._tcp.local
│
└─ Frontend (Dashboard Monitor tab)
    ├─ listen("result-received") → update table row
    └─ listen("heartbeat-received") → update progress, detect timeout >30s
```

---

## FIX 1: Creator lib.rs — Đăng ký SharedLanState

**File**: `apps/creator/src-tauri/src/lib.rs`

**Vấn đề**: `SharedLanState` cần được `manage()` trước khi commands dùng nó.

```rust
// Thêm vào lib.rs
use std::sync::Arc;
use tokio::sync::Mutex;
use commands::network_commands::{LanServerState, SharedLanState};

pub fn run() {
    // Khởi tạo LAN server state
    let lan_state: SharedLanState = Arc::new(Mutex::new(LanServerState {
        shutdown_tx: None,
        is_running: false,
        port: 41235,
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .manage(lan_state)  // ← THÊM DÒNG NÀY
        .setup(|app| {
            // DB init (giữ nguyên)
            let app_dir = app.path().app_data_dir()...;
            ...
        })
        .invoke_handler(tauri::generate_handler![
            // Quiz commands (giữ nguyên)
            commands::quiz_commands::get_all_quizzes,
            ...
            // Network commands — THÊM CÁC COMMAND CÒN THIẾU
            commands::network_commands::start_receive_mode,
            commands::network_commands::stop_receive_mode,      // ← THÊM
            commands::network_commands::get_lan_server_status,  // ← THÊM
            commands::network_commands::get_local_ip,           // ← THÊM
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## FIX 2: Hợp nhất 2 server implementations

**Vấn đề**: `network_commands.rs` có server Axum nhưng không có mDNS. `network/server.rs` có mDNS nhưng không được gọi.

**Giải pháp**: Xóa `network/server.rs`, gộp mDNS vào `network_commands.rs`.

**File**: `apps/creator/src-tauri/src/commands/network_commands.rs`

```rust
// Thêm mDNS vào start_receive_mode
use mdns_sd::{ServiceDaemon, ServiceInfo};

#[tauri::command]
pub async fn start_receive_mode(
    port: u16,
    state: State<'_, SharedLanState>,
    app_handle: AppHandle,
    db: State<'_, crate::database::DbState>,  // THÊM để save to DB
) -> Result<LanServerStatus, AppError> {
    let mut s = state.lock().await;
    if s.is_running {
        let ip = get_local_ip().await.unwrap_or_else(|_| "0.0.0.0".to_string());
        return Ok(LanServerStatus { is_running: true, port: s.port, ip });
    }

    let (tx, rx) = tokio::sync::oneshot::channel::<()>();
    s.shutdown_tx = Some(tx);
    s.is_running = true;
    s.port = port;
    drop(s);  // Release lock before spawning

    let db_pool = db.pool.clone();
    let app_handle_clone = app_handle.clone();

    tokio::spawn(async move {
        // Start Axum HTTP server
        let app = Router::new()
            .route("/result", post(handle_post_result))
            .route("/heartbeat", post(handle_heartbeat))
            .route("/health", get(|| async { Json(serde_json::json!({ "status": "ok" })) }))
            .with_state((app_handle_clone.clone(), db_pool));

        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

        // Start mDNS advertisement
        if let Ok(mdns) = ServiceDaemon::new() {
            let host_ipv4: Ipv4Addr = get_local_ip().await
                .ok()
                .and_then(|ip| ip.parse().ok())
                .unwrap_or(Ipv4Addr::LOCALHOST);

            if let Ok(service) = ServiceInfo::new(
                "_quizforge._tcp.local.",
                "QuizForge_Creator",
                &format!("{}.local.", host_ipv4),
                host_ipv4,
                port,
                &[("version", "1.0")][..],
            ) {
                let _ = mdns.register(service);
                println!("mDNS registered on port {}", port);
            }
        }

        axum::serve(listener, app)
            .with_graceful_shutdown(async { rx.await.ok(); })
            .await
            .unwrap();
    });

    let ip = get_local_ip().await.unwrap_or_else(|_| "0.0.0.0".to_string());
    Ok(LanServerStatus { is_running: true, port, ip })
}
```

---

## FIX 3: Save Result vào SQLite khi nhận từ Player

**File**: `apps/creator/src-tauri/src/commands/network_commands.rs`

```rust
// State type thay đổi thành tuple để include db pool
type HandlerState = (AppHandle, sqlx::SqlitePool);

async fn handle_post_result(
    AxumState((app_handle, pool)): AxumState<HandlerState>,
    Json(result): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    // 1. Validate structure (minimal)
    let quiz_id = result["quiz_id"].as_str().unwrap_or("unknown");
    let student_name = result["student_name"].as_str().unwrap_or("Anonymous");

    // 2. Save to quiz_results table
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    let save_result = sqlx::query!(
        r#"INSERT INTO quiz_results
           (id, quiz_id, quiz_title, student_id, student_name,
            started_at, completed_at, total_points, earned_points,
            percentage, passed, question_results_json, machine_id,
            submitted_via, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lan', ?)"#,
        id,
        quiz_id,
        result["quiz_title"].as_str().unwrap_or(""),
        result["student_id"].as_str(),
        student_name,
        result["started_at"].as_str().unwrap_or(&now.to_rfc3339()),
        result["completed_at"].as_str().unwrap_or(&now.to_rfc3339()),
        result["total_points"].as_i64().unwrap_or(0),
        result["earned_points"].as_i64().unwrap_or(0),
        result["percentage"].as_f64().unwrap_or(0.0),
        result["passed"].as_bool().unwrap_or(false) as i64,
        result["question_results"].to_string(),
        result["machine_id"].as_str(),
        now.to_rfc3339(),
    ).execute(&pool).await;

    if let Err(e) = save_result {
        eprintln!("Failed to save result: {}", e);
    }

    // 3. Emit to frontend
    let _ = app_handle.emit("result-received", &result);

    Json(serde_json::json!({ "status": "ok", "id": id }))
}

async fn handle_heartbeat(
    AxumState((app_handle, _pool)): AxumState<HandlerState>,
    Json(heartbeat): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    let _ = app_handle.emit("heartbeat-received", &heartbeat);
    Json(serde_json::json!({ "status": "ok" }))
}
```

---

## FIX 4: Player — 3-tier Result Submission (Frontend)

**File**: `apps/player/src/components/ResultScreen.tsx`

Thêm submission logic vào ResultScreen (gọi khi component mount):

```tsx
import { invoke } from '@tauri-apps/api/core'
import { Quiz, QuizResult, QuestionResult, Student, ValidationResult } from '@quizforge/types'

// Submission status state
const [submitStatus, setSubmitStatus] = useState<
    'pending' | 'submitting' | 'success' | 'fallback' | 'local' | 'failed'
>('pending')
const [submitMessage, setSubmitMessage] = useState('')

useEffect(() => {
    // Auto-submit khi vào result screen
    submitResult()
}, [])

const submitResult = async () => {
    setSubmitStatus('submitting')

    const resultPayload: QuizResult = {
        id: crypto.randomUUID(),
        quizId: quiz!.id,
        quizTitle: (quiz!.information as any)?.title || '',
        studentId: selectedStudent?.studentId,
        studentName: selectedStudent?.name || 'Anonymous',
        className: selectedStudent?.className,
        startedAt: new Date(startTime!).toISOString(),
        completedAt: new Date().toISOString(),
        totalPoints,
        earnedPoints,
        percentage,
        passed,
        questionResults: buildQuestionResults(),
        machineId: await invoke<string>('get_machine_id').catch(() => 'unknown'),
        submittedVia: 'local',
    }

    // TIER 1: HTTP POST nếu có URL
    const serverUrl = (quiz?.settings as any)?.resultServerUrl
    if (serverUrl) {
        try {
            await invoke('send_result_http', { url: `${serverUrl}/result`, result: resultPayload })
            setSubmitStatus('success')
            setSubmitMessage('Đã gửi kết quả thành công!')
            return
        } catch {
            // Thử tier 2
        }
    }

    // TIER 2: LAN Discovery
    try {
        const lanServers = await invoke<string[]>('discover_lan_server')
        if (lanServers.length > 0) {
            const serverAddr = lanServers[0]  // Lấy server đầu tiên tìm thấy
            await invoke('send_result_http', {
                url: `http://${serverAddr}/result`,
                result: { ...resultPayload, submittedVia: 'lan' }
            })
            setSubmitStatus('success')
            setSubmitMessage('Đã gửi kết quả qua mạng LAN!')
            return
        }
    } catch {
        // Thử tier 3
    }

    // TIER 3: Local file
    try {
        await invoke('save_result_local', { result: resultPayload })
        setSubmitStatus('local')
        setSubmitMessage('Kết quả đã lưu vào máy. Vui lòng gửi file cho giáo viên.')
    } catch {
        setSubmitStatus('failed')
        setSubmitMessage('Không thể lưu kết quả. Vui lòng chụp màn hình và gửi cho giáo viên.')
    }
}
```

**Cần thêm Rust command** `save_result_local`:

**File**: `apps/player/src-tauri/src/commands/network.rs`

```rust
#[tauri::command]
pub async fn save_result_local(result: serde_json::Value) -> Result<String, String> {
    let student_name = result["studentName"].as_str().unwrap_or("unknown")
        .replace(' ', "_");
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("result_{}_{}.json", student_name, timestamp);

    // Save to Desktop
    let desktop = dirs::desktop_dir()
        .unwrap_or_else(|| std::env::current_dir().unwrap());
    let file_path = desktop.join(&filename);

    std::fs::write(&file_path, result.to_string())
        .map_err(|e| format!("Không thể lưu file: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}
```

> Cần thêm `dirs` crate vào `Cargo.toml`:
> `dirs = "5.0"`

**Hiển thị submission status trong ResultScreen**:
```tsx
{/* Submission Status Banner */}
<div className={`px-6 py-3 rounded-2xl flex items-center gap-3 ${
    submitStatus === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
    submitStatus === 'submitting' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
    submitStatus === 'local' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
    submitStatus === 'failed' ? 'bg-red-50 border border-red-200 text-red-800' :
    'bg-slate-50 border border-slate-200 text-slate-600'
}`}>
    {submitStatus === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
    {submitStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
    {submitStatus === 'local' && <HardDrive className="w-4 h-4" />}
    {submitStatus === 'failed' && <AlertCircle className="w-4 h-4" />}
    <span className="text-xs font-bold">{submitMessage || 'Đang gửi kết quả...'}</span>
</div>
```

---

## FIX 5: Player — Heartbeat Sender

**Mục đích**: Mỗi 10 giây, player gửi heartbeat cho Creator để hiển thị progress real-time trên Monitor.

**File**: `apps/player/src/components/QuizPlayer.tsx`

```tsx
// Heartbeat sender hook
useEffect(() => {
    if (phase !== 'quiz') return

    const sendHeartbeat = async () => {
        const state = usePlayerStore.getState()
        const totalQuestions = state.quiz?.questions?.length || 0
        const answeredCount = Object.keys(state.answers).length

        const heartbeat = {
            studentId: state.selectedStudent?.studentId,
            studentName: state.selectedStudent?.name || 'Unknown',
            className: state.selectedStudent?.className || '',
            quizId: state.quiz?.id,
            currentQuestion: state.currentQuestionIndex + 1,
            totalQuestions,
            completionPercent: Math.round((answeredCount / totalQuestions) * 100),
            earnedPoints: Object.values(state.questionResults)
                .reduce((sum, r) => sum + r.points_earned, 0),
            tabOutCount: 0,  // TODO: track this
            windowFocused: document.hasFocus(),
            timestamp: new Date().toISOString(),
        }

        try {
            // Discover server mỗi lần (hoặc cache IP)
            const servers = await invoke<string[]>('discover_lan_server')
            if (servers.length > 0) {
                await invoke('send_result_http', {
                    url: `http://${servers[0]}/heartbeat`,
                    result: heartbeat
                })
            }
        } catch {
            // Heartbeat failure là non-critical, ignore
        }
    }

    const interval = setInterval(sendHeartbeat, 10_000)
    return () => clearInterval(interval)
}, [phase])
```

> **Optimization**: Cache discovered server IP trong store để không phải mDNS lookup mỗi 10s.
> Thêm `lanServerIp: string | null` vào playerStore.

---

## FIX 6: Creator Frontend — Dashboard Monitor Real-time

**File**: `apps/creator/src/pages/Dashboard.tsx`

```tsx
import { listen } from '@tauri-apps/api/event'
import { MonitorStudent } from '@quizforge/types'

// State cho monitor
const [monitorStudents, setMonitorStudents] = useState<MonitorStudent[]>([])
const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

useEffect(() => {
    // Listen kết quả nộp bài
    const unlistenResult = listen<QuizResult>('result-received', (event) => {
        const result = event.payload
        setMonitorStudents(prev => {
            const existing = prev.findIndex(s =>
                s.studentName === result.student_name
            )
            const updated: MonitorStudent = {
                studentName: result.student_name || '',
                className: result.class_name || '',
                ip: result.machine_id || 'LAN',
                completionPercent: 100,
                earnedPoints: result.earned_points,
                totalPoints: result.total_points,
                status: 'submitted',
                tabOutCount: 0,
                submittedAt: new Date().toISOString(),
            }
            if (existing >= 0) {
                const newList = [...prev]
                newList[existing] = updated
                return newList
            }
            return [...prev, updated]
        })
        setLastUpdate(new Date())
    })

    // Listen heartbeat
    const unlistenHeartbeat = listen('heartbeat-received', (event) => {
        const hb = event.payload as any
        setMonitorStudents(prev => {
            const existing = prev.findIndex(s => s.studentName === hb.studentName)
            const updated: MonitorStudent = {
                studentName: hb.studentName || '',
                className: hb.className || '',
                ip: hb.ip || '',
                completionPercent: hb.completionPercent || 0,
                earnedPoints: hb.earnedPoints || 0,
                totalPoints: 0,  // Chưa biết, điền sau
                status: 'working',
                tabOutCount: hb.tabOutCount || 0,
                lastHeartbeat: new Date().toISOString(),
            }
            if (existing >= 0) {
                const newList = [...prev]
                // Không overwrite nếu đã 'submitted'
                if (newList[existing].status !== 'submitted') {
                    newList[existing] = updated
                }
                return newList
            }
            return [...prev, updated]
        })
        setLastUpdate(new Date())
    })

    // Detect timeout: mark 'disconnected' nếu không có heartbeat >30s
    const timeoutCheck = setInterval(() => {
        const thirtySecsAgo = Date.now() - 30_000
        setMonitorStudents(prev => prev.map(s => {
            if (s.status === 'submitted') return s
            const lastHb = s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : 0
            if (lastHb < thirtySecsAgo && lastHb > 0) {
                return { ...s, status: 'disconnected' }
            }
            return s
        }))
    }, 5_000)

    return () => {
        unlistenResult.then(fn => fn())
        unlistenHeartbeat.then(fn => fn())
        clearInterval(timeoutCheck)
    }
}, [])
```

---

## FIX 7: ReceiveMode.tsx — Connect thật

**File**: `apps/creator/src/pages/ReceiveMode.tsx`

```tsx
import { invoke } from '@tauri-apps/api/core'
import { LanServerStatus } from '@quizforge/types'

export function ReceiveMode() {
    const [status, setStatus] = useState<LanServerStatus | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    const startReceiving = async () => {
        setIsStarting(true)
        try {
            const result = await invoke<LanServerStatus>('start_receive_mode', { port: 41235 })
            setStatus(result)
        } catch (error) {
            console.error('Failed to start receive mode:', error)
        } finally {
            setIsStarting(false)
        }
    }

    const stopReceiving = async () => {
        await invoke('stop_receive_mode')
        setStatus(null)
    }

    useEffect(() => {
        // Check current status on mount
        invoke<LanServerStatus>('get_lan_server_status')
            .then(setStatus)
            .catch(() => {})
    }, [])

    // ... render với status thật
}
```

---

## THỨ TỰ IMPLEMENT

```
Sprint 1 — Creator Backend Fix (không có thì server không start):
├── FIX 1: lib.rs — manage(SharedLanState)              [15 phút]
├── FIX 1: lib.rs — đăng ký missing commands            [10 phút]
├── FIX 2: network_commands.rs — tích hợp mDNS          [45 phút]
└── FIX 3: handle_post_result — save to SQLite           [30 phút]

Sprint 2 — Player Result Submission:
├── FIX 4a: save_result_local Rust command              [20 phút]
├── FIX 4b: ResultScreen submission logic (3-tier)      [60 phút]
└── FIX 4c: Submission status UI                        [20 phút]

Sprint 3 — Heartbeat + Real-time Monitor:
├── FIX 5: QuizPlayer heartbeat sender                  [30 phút]
├── FIX 6: Dashboard monitor real-time events           [60 phút]
└── FIX 7: ReceiveMode.tsx connect thật                 [30 phút]

Sprint 4 — Polish:
├── Cache LAN server IP trong playerStore               [15 phút]
├── Tab-out counter tracking                            [20 phút]
└── Xóa network/server.rs (dead code)                  [5 phút]
```

---

## FILES CẦN THAY ĐỔI

| File | Loại thay đổi |
|---|---|
| `apps/creator/src-tauri/src/lib.rs` | Thêm manage(SharedLanState), register missing commands |
| `apps/creator/src-tauri/src/commands/network_commands.rs` | Thêm mDNS, save to SQLite, fix HandlerState type |
| `apps/creator/src-tauri/src/network/server.rs` | XÓA (duplicate/dead code) |
| `apps/creator/src-tauri/Cargo.toml` | Verify mdns-sd, uuid, chrono deps |
| `apps/player/src/components/ResultScreen.tsx` | Thêm 3-tier submission + status UI |
| `apps/player/src/components/QuizPlayer.tsx` | Thêm heartbeat sender |
| `apps/player/src/store/playerStore.ts` | Thêm lanServerIp cache field |
| `apps/player/src-tauri/src/commands/network.rs` | Thêm save_result_local command |
| `apps/player/src-tauri/src/lib.rs` | Đăng ký save_result_local trong invoke_handler |
| `apps/player/src-tauri/Cargo.toml` | Thêm dirs = "5.0" |
| `apps/creator/src/pages/Dashboard.tsx` | Real-time monitor với listen() |
| `apps/creator/src/pages/ReceiveMode.tsx` | Connect thật với Tauri commands |

---

## PAYLOAD FORMAT (Contract giữa Player và Creator)

```typescript
// QuizResult payload gửi từ Player → Creator
{
    id: string,                    // UUID mới
    quiz_id: string,               // ID của quiz
    quiz_title: string,
    student_id?: string,           // Mã HS nếu có
    student_name: string,
    class_name?: string,
    started_at: string,            // ISO 8601
    completed_at: string,
    total_points: number,
    earned_points: number,
    percentage: number,            // 0-100
    passed: boolean,
    question_results: {            // Per-question
        [questionId: string]: {
            is_correct: boolean,
            points_earned: number,
            time_spent_seconds: number,
        }
    },
    machine_id: string,            // Hardware fingerprint
    submitted_via: 'http' | 'lan' | 'local'
}

// Heartbeat payload (mỗi 10s)
{
    student_name: string,
    class_name: string,
    quiz_id: string,
    current_question: number,      // 1-based
    total_questions: number,
    completion_percent: number,    // 0-100
    earned_points: number,
    tab_out_count: number,
    window_focused: boolean,
    timestamp: string,             // ISO 8601
}
```

---

## ACCEPTANCE CRITERIA

**Creator**:
- [ ] `start_receive_mode` không crash (SharedLanState managed)
- [ ] Server start → mDNS advertisement bắt đầu
- [ ] POST /result → lưu vào quiz_results SQLite table
- [ ] POST /result → emit "result-received" event → Dashboard update
- [ ] POST /heartbeat → emit "heartbeat-received" → Monitor update progress
- [ ] ReceiveMode.tsx hiện IP + port thật, toggle bật/tắt hoạt động
- [ ] Dashboard Monitor: row thêm khi nhận result mới
- [ ] Dashboard Monitor: progress update khi nhận heartbeat
- [ ] Student "Mất kết nối" sau 30s không heartbeat

**Player**:
- [ ] Nộp bài xong → ResultScreen tự động submit
- [ ] Tier 1 (HTTP): gửi thành công → hiện banner xanh
- [ ] Tier 2 (LAN): mDNS discover → gửi → hiện banner xanh
- [ ] Tier 3 (local): file lưu Desktop, tên `result_TenHS_Timestamp.json`
- [ ] Heartbeat gửi mỗi 10s trong lúc làm bài
- [ ] Không crash nếu mất network
