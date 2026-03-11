# P2 — Player Renderers + App Data Pipeline
> **Senior Engineer Assessment** — Đọc kỹ trước khi code
> Cập nhật: 2026-03-08

---

## THỰC TẾ HIỆN TẠI (sau khi đọc source)

> **Lại KHÔNG phải stub rỗng** — 9/10 renderer đã có UI code. Vấn đề là:
> 1. Data đến từ mock, không phải Tauri invoke
> 2. Type mismatch giữa schema và code
> 3. `submitAnswer` là mock validation, không gọi Rust

### Trạng thái thực tế từng renderer:

| Renderer | UI Code | Đúng Schema | Feedback State | Vấn đề chính |
|---|---|---|---|---|
| `TrueFalsePlayer` | ✅ Rất đẹp | ✅ `answers[id] === 'true'/'false'` | ✅ Có | Dùng `(option: any)` |
| `MultipleChoicePlayer` | ✅ Đẹp | ❌ `option.label` không tồn tại trong schema | ⚠️ Chỉ chọn sai/đúng, không show đúng answer | Cần tự tính label A/B/C/D từ index |
| `MultipleResponsePlayer` | ✅ OK | ✅ Array of IDs | ❌ Không có feedback state sau submit | Thiếu visual feedback |
| `FillInBlankPlayer` | ✅ Inline inputs | ⚠️ Parse `{{uuid}}`, editor dùng `{{blank_xxxx}}` — cần kiểm tra khớp | ✅ Cơ bản | Regex cần đúng format |
| `MatchingPlayer` | ✅ Click-to-match | ✅ `{leftId: rightId}` map | ❌ Không có feedback | Thiếu visual sau submit |
| `SequencePlayer` | ✅ dnd-kit đầy đủ | ✅ Array of IDs | ❌ Không có feedback | Thiếu visual sau submit |
| `WordBankPlayer` | ✅ Click-to-fill | ❌ **MISMATCH**: Player parse `[[slotId]]` nhưng editor write `{{bank_xxxx}}` | ❌ Không có feedback | Format string không khớp |
| `ClickMapPlayer` | ✅ Click + visual | ⚠️ Store `{x,y}[]` nhưng validate.rs cần check hotspot rect | ❌ Không có feedback | Validate luôn return true |
| `ShortEssayPlayer` | ✅ Textarea | ✅ String | ❌ Không cần (manual grade) | Word count nên dùng word, không char |
| `BlankPagePlayer` | ✅ HTML render | ✅ Không cần answer | N/A | OK |

### Bugs nghiêm trọng cần fix TRƯỚC KHI render:

1. **`App.tsx` dùng mock data** — không gọi `invoke('load_quiz_data')` và `invoke('get_students')`
2. **`playerStore.submitAnswer()`** — mock validation (`answer === 'a' || !!answer`) không gọi `invoke('validate_answer')`
3. **`playerStore` toàn `any`** — `quiz: any`, `students: any[]`, `answers: Record<string, any>`
4. **Timer `QuizPlayer.tsx`** — hardcode `"25:00"`, không countdown thật
5. **`ResultScreen.tsx`** — hardcode `score = 85`, `17/20`, `12:45`

---

## PHẦN 1: FIX DATA PIPELINE (Làm TRƯỚC mọi thứ)

### TASK A: Connect App.tsx → Tauri thật

**File**: `apps/player/src/App.tsx`

```tsx
// XÓA toàn bộ mock data, thay bằng:
useEffect(() => {
    async function loadData() {
        try {
            // 1. Load quiz data (decrypt quiz.dat)
            const quizData = await invoke<Quiz>('load_quiz_data')
            setQuiz(quizData)

            // 2. Load students (students.dat nếu có)
            const studentData = await invoke<Student[]>('get_students')
            setStudents(studentData)
        } catch (error) {
            // Hiện error screen thay vì crash
            console.error('Failed to load quiz:', error)
            setLoadError(String(error))
        }
    }
    loadData()

    // Window blur → lockdown detection
    const unlisten = getCurrentWindow().listen('tauri:blur', () => {
        if (usePlayerStore.getState().phase === 'quiz') {
            setLockdownWarning(true)
        }
    })
    return () => { unlisten.then(fn => fn()) }
}, [])
```

Thêm error state:
```tsx
const [loadError, setLoadError] = useState<string | null>(null)

if (loadError) {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-8">
            <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-red-800">Không thể tải bài thi</h2>
                <p className="text-sm text-red-600 font-mono bg-red-100 p-3 rounded-lg">{loadError}</p>
                <p className="text-xs text-slate-500">Vui lòng liên hệ giáo viên để được hỗ trợ.</p>
            </div>
        </div>
    )
}
```

### TASK B: Fix playerStore Types (bỏ `any`)

**File**: `apps/player/src/store/playerStore.ts`

```typescript
import { Quiz, Student, ValidationResult } from '@quizforge/types'

// Answer types per question type
type AnswerValue =
    | string                    // true_false: 'true'/'false', multiple_choice: optionId
    | string[]                  // multiple_response: [optionId,...], sequence: [id,...]
    | Record<string, string>    // fill_in_blank: {blankId: text}, matching: {leftId: rightId}, word_bank: {slotId: wordId}
    | Array<{x: number, y: number}>  // click_map

interface PlayerState {
    quiz: Quiz | null
    students: Student[]
    phase: Phase
    selectedStudent: Student | null
    currentQuestionIndex: number
    answers: Record<string, AnswerValue>
    questionResults: Record<string, ValidationResult>
    startTime: number | null
    questionStartTime: number | null
    outlinePanelOpen: boolean
    feedbackVisible: boolean
    lastValidationResult: ValidationResult | null
    lockdownWarning: boolean   // ĐỔI TÊN từ feedbackVisible overload
    // Actions ...
}
```

### TASK C: Fix submitAnswer → gọi Rust validate_answer thật

**File**: `apps/player/src/store/playerStore.ts`

```typescript
submitAnswer: async () => {
    const state = get()
    const question = state.quiz?.questions?.[state.currentQuestionIndex]
    if (!question) return
    if (state.feedbackVisible) return  // đã nộp rồi

    const answer = state.answers[question.id]
    if (answer === undefined || answer === null) return

    try {
        // Gọi Rust validate
        const result = await invoke<ValidationResult>('validate_answer', {
            questionId: question.id,
            answer: answer
        })

        // Lưu kết quả
        set(produce((draft: PlayerState) => {
            draft.questionResults[question.id] = result
            draft.lastValidationResult = result
            draft.feedbackVisible = true
        }))
    } catch (error) {
        console.error('Validation failed:', error)
        // Fallback: mark as 0 points
        const fallback: ValidationResult = {
            is_correct: false,
            points_earned: 0,
            correct_feedback: null,
            incorrect_feedback: 'Lỗi kết nối. Kết quả sẽ được xử lý thủ công.'
        }
        set(produce((draft: PlayerState) => {
            draft.questionResults[question.id] = fallback
            draft.lastValidationResult = fallback
            draft.feedbackVisible = true
        }))
    }
}
```

> **Lưu ý**: `submitAnswer` phải trở thành `async`. Cần thay `setLockdownWarning` thành field riêng `lockdownWarning` trong store, không overload `feedbackVisible`.

### TASK D: Fix Timer trong QuizPlayer.tsx

```tsx
// Thêm timer state
const [timeLeft, setTimeLeft] = useState<number | null>(null)

useEffect(() => {
    if (!quiz?.settings?.timeLimit) return

    const totalSeconds = quiz.settings.timeLimit
    setTimeLeft(totalSeconds)

    const interval = setInterval(() => {
        setTimeLeft(prev => {
            if (prev === null || prev <= 0) {
                clearInterval(interval)
                // Auto-submit all remaining
                setPhase('result')
                return 0
            }
            return prev - 1
        })
    }, 1000)

    return () => clearInterval(interval)
}, [quiz, setPhase])

// Format display
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

// Warning khi < 20%
const isWarning = timeLeft !== null && quiz?.settings?.timeLimit
    && timeLeft < quiz.settings.timeLimit * 0.2

// Trong JSX
<span className={`text-sm font-black font-mono ${isWarning ? 'text-red-400 animate-pulse' : 'text-brand-200'}`}>
    {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
</span>
```

---

## PHẦN 2: FIX RENDERERS — VẤN ĐỀ CỤ THỂ

### FIX 1: MultipleChoicePlayer — `option.label` không tồn tại

```tsx
// Schema: MultipleChoiceOption = { id, text, isCorrect, feedback?, media? }
// KHÔNG có `label` field!

// Fix: tính label từ index
{question.options.map((option, idx) => {
    const label = String.fromCharCode(65 + idx)  // A, B, C, D...
    const isSelected = answers[question.id] === option.id
    // ...
    return (
        <button key={option.id} onClick={() => setAnswer(question.id, option.id)}>
            <div className={`label-circle`}>{label}</div>
            <span>{option.text}</span>
        </button>
    )
})}
```

> **Lưu ý**: `question` trong player store là `any` do mock data. Sau khi fix TASK B, phải narrow type đúng.
> Trong QuizPlayer.tsx, `currentQuestion as any` cần bỏ → dùng type guard.

### FIX 2: MultipleResponsePlayer — Thiếu feedback state

Thêm visual states giống TrueFalsePlayer sau khi submit:
```tsx
// Sau submit, hiện:
// - Các option user chọn mà đúng: green border
// - Các option user chọn mà sai: red border
// - Các option user không chọn mà đúng: green dashed border (cho biết đáp án đúng)
const isSelected = currentSelection.includes(option.id)
const isCorrectOption = option.isCorrect  // chỉ có sau khi decrypt — KHÔNG expose trực tiếp

// Vấn đề: player không biết option nào isCorrect (đã bị strip ra khỏi display_data)
// Solution: validate_answer trả về các correct IDs để show?
// Hoặc: chỉ show "đúng/sai" tổng thể, không chỉ từng option
// → Giữ đơn giản: sau submit chỉ show overall correct/incorrect, không reveal từng option
```

> **Quyết định thiết kế**: Không reveal từng option đúng/sai vì đó là thông tin nhạy cảm.
> Chỉ show: overall correct/incorrect + điểm. Consistent với security model.

### FIX 3: WordBankPlayer — Format string MISMATCH

**Vấn đề nghiêm trọng**: Editor viết `{{bank_xxxx}}` vào templateText, nhưng Player parse `[[slotId]]`.

**Giải pháp**: Chuẩn hóa format. Chọn một format duy nhất.

**Quyết định**: Dùng `{{slot_N}}` với N là số thứ tự slot (đơn giản, human-readable, dễ debug).

**Thay đổi cần làm**:
1. **WordBankEditor.tsx**: Khi user nhập `[_]` vào template → convert thành `{{slot_0}}`, `{{slot_1}}`, v.v.
2. **WordBankPlayer.tsx**: Parse `{{slot_N}}` → match với `slots[N]`

```tsx
// WordBankPlayer.tsx - fix regex
const parts = question.templateText.split(/({{slot_\d+}})/)

parts.map((part, index) => {
    const match = part.match(/{{slot_(\d+)}}/)
    if (match) {
        const slotIndex = parseInt(match[1])
        const slot = question.slots[slotIndex]
        // ...render slot button
    }
})
```

### FIX 4: ClickMapPlayer — Validation luôn trả về true

**Vấn đề**: `validate.rs` click_map là placeholder:
```rust
"click_map" => {
    is_correct = true; // Placeholder!
    points_ratio = 1.0;
}
```

**Fix trong validate.rs**:
```rust
"click_map" => {
    // answer = [{x: f64, y: f64}] — percentage coordinates
    // correct_answer = { hotspots: [{x, y, w, h, isCorrect: bool}] }
    let hotspots = q_answer.correct_answer["hotspots"].as_array()
        .ok_or("Invalid hotspot format")?;
    let clicks = answer.as_array().ok_or("Invalid click format")?;

    let mut hit_correct = false;
    let mut hit_wrong = false;

    for click in clicks {
        let cx = click["x"].as_f64().unwrap_or(0.0);
        let cy = click["y"].as_f64().unwrap_or(0.0);

        for hotspot in hotspots {
            let x = hotspot["x"].as_f64().unwrap_or(0.0);
            let y = hotspot["y"].as_f64().unwrap_or(0.0);
            let w = hotspot["w"].as_f64().unwrap_or(0.0);
            let h = hotspot["h"].as_f64().unwrap_or(0.0);
            let is_correct_hs = hotspot["isCorrect"].as_bool().unwrap_or(false);

            // Point in rectangle check
            if cx >= x && cx <= x + w && cy >= y && cy <= y + h {
                if is_correct_hs {
                    hit_correct = true;
                } else {
                    hit_wrong = true;
                }
            }
        }
    }

    is_correct = hit_correct && !hit_wrong;
    if is_correct { points_ratio = 1.0; }
}
```

**Vấn đề liên quan**: `prepare_player_bundle` trong export_commands.rs cần include hotspot data trong `answers_json`, bao gồm cả `isCorrect` của mỗi hotspot. Hiện tại code chỉ strip `isCorrect` từ options (MC), không xử lý hotspots.

**Fix export_commands.rs** `split_quiz_data`:
```rust
// Thêm case cho click_map
if let Some(hotspots) = q["hotspots"].as_array() {
    let correct_hotspot_data: Vec<Value> = hotspots.iter().map(|h| {
        serde_json::json!({
            "x": h["coords"][0],
            "y": h["coords"][1],
            "w": h["coords"][2],
            "h": h["coords"][3],
            "isCorrect": h["isCorrect"]
        })
    }).collect();
    q_answer["hotspots"] = Value::Array(correct_hotspot_data);

    // Strip isCorrect from display
    if let Some(display_hotspots) = q["hotspots"].as_array_mut() {
        for h in display_hotspots {
            if let Some(obj) = h.as_object_mut() {
                obj.remove("isCorrect");
            }
        }
    }
}
```

### FIX 5: FillInBlank — Kiểm tra format alignment

Editor hiện dùng `{{blank_xxxx}}` (4 ký tự của UUID) làm placeholder trong templateText.
Player parse regex `(\{\{[^}]+\}\})`.

**Vấn đề**: Regex của player đúng, nhưng cần verify rằng `blankId` extracted từ `{{blank_xxxx}}` khớp với `blank.id.slice(0, 4)` từ editor.

**Giải pháp đơn giản**: Thay vì dùng partial UUID, dùng toàn bộ blank.id làm marker.

Editor: `{{blank_${newBlank.id}}}` → Player regex: `\{\{blank_([^}]+)\}\}` → extract full UUID

Đổi luôn để chắc chắn:
- Editor: `{{blank_${newBlank.id}}}`
- Player regex: `/({{blank_[^}]+}})/` → extract `blank_xxxx-xxxx-...`
- Player `blankId = match[1].replace('blank_', '')` → full UUID → lookup trong `question.blanks`

### FIX 6: ShortEssayPlayer — Word count thay vì char count

```tsx
// Đổi từ text.length (ký tự) sang word count
const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
const maxWords = question.maxWords || 0

<span className={`${maxWords && wordCount > maxWords ? 'text-red-500' : 'text-brand-600'}`}>
    {wordCount} từ {maxWords ? `/ ${maxWords} từ` : ''}
</span>

{/* Warning nếu vượt quá */}
{maxWords && wordCount > maxWords && (
    <p className="text-xs text-red-500 font-medium">
        Vượt quá giới hạn {maxWords} từ
    </p>
)}
```

---

## PHẦN 3: FIX RESULT SCREEN

**File**: `apps/player/src/components/ResultScreen.tsx`

```tsx
export function ResultScreen() {
    const {
        quiz,
        selectedStudent,
        questionResults,
        answers,
        startTime,
    } = usePlayerStore()

    // Tính từ questionResults thật (không mock)
    const questions = quiz?.questions || []
    const totalQuestions = questions.filter(q => q.type !== 'blank_page').length

    const earnedPoints = Object.values(questionResults)
        .reduce((sum, r) => sum + (r.points_earned || 0), 0)

    const totalPoints = questions
        .filter(q => q.type !== 'blank_page')
        .reduce((sum, q) => sum + (q.points?.correct || 0), 0)

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    const passPercentage = (quiz?.settings as any)?.passingRate || 80
    const passed = percentage >= passPercentage

    const correctCount = Object.values(questionResults).filter(r => r.is_correct).length
    const answeredCount = Object.keys(answers).length

    const timeSpentSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    const timeSpentStr = formatTime(timeSpentSeconds)

    // ...render với data thật
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}
```

---

## THỨ TỰ IMPLEMENT

```
Bước 1 (CRITICAL — không có thì không chạy được):
├── TASK A: App.tsx → invoke thật                    [30 phút]
├── TASK B: playerStore types fix                    [45 phút]
└── TASK C: submitAnswer → invoke('validate_answer') [30 phút]

Bước 2 (Fix từng renderer bug):
├── FIX 1: MultipleChoicePlayer option.label         [10 phút]
├── FIX 3: WordBankPlayer format string              [30 phút]
├── FIX 5: FillInBlankPlayer format alignment        [20 phút]
└── FIX 6: ShortEssayPlayer word count              [10 phút]

Bước 3 (Fix timer + result):
├── TASK D: Timer countdown thật                     [30 phút]
└── TASK E: ResultScreen dùng data thật             [30 phút]

Bước 4 (Rust fixes):
├── FIX 4: validate.rs click_map hitbox detection    [30 phút]
└── FIX export: split_quiz_data include hotspots     [20 phút]
```

---

## FILES CẦN THAY ĐỔI

| File | Loại thay đổi |
|---|---|
| `apps/player/src/App.tsx` | Replace mock → real invoke |
| `apps/player/src/store/playerStore.ts` | Replace `any` types, fix submitAnswer async |
| `apps/player/src/components/QuizPlayer.tsx` | Add real timer, remove `as any` |
| `apps/player/src/components/ResultScreen.tsx` | Replace mock data với computed data |
| `apps/player/src/renderers/MultipleChoicePlayer.tsx` | Fix option.label → index |
| `apps/player/src/renderers/MultipleResponsePlayer.tsx` | Fix feedback visual |
| `apps/player/src/renderers/WordBankPlayer.tsx` | Fix format string parse |
| `apps/player/src/renderers/FillInBlankPlayer.tsx` | Fix regex format |
| `apps/player/src/renderers/ShortEssayPlayer.tsx` | Fix word count |
| `apps/player/src-tauri/src/commands/validate.rs` | Fix click_map hitbox |
| `apps/creator/src-tauri/src/commands/export_commands.rs` | Include hotspot data in answers |

**KHÔNG cần thay đổi** (đã hoạt động đúng):
- `TrueFalsePlayer.tsx` ✅
- `MatchingPlayer.tsx` ✅
- `SequencePlayer.tsx` ✅
- `BlankPagePlayer.tsx` ✅
- `useKeyboardNavigation.ts` ✅ (đã implement đầy đủ)

---

## ACCEPTANCE CRITERIA

- [ ] Player khởi động → tự động load quiz.dat thật (không mock)
- [ ] Nếu quiz.dat không tồn tại → hiện error screen rõ ràng (không crash)
- [ ] Chọn học sinh → bắt đầu làm bài
- [ ] Mỗi loại câu hỏi render đúng (test với quiz thật từ Creator)
- [ ] Nhấn "Nộp câu" → gọi validate_answer Rust, nhận ValidationResult thật
- [ ] Feedback bar hiện đúng: điểm, feedback text từ Rust
- [ ] Timer countdown theo quiz.settings.timeLimit
- [ ] Timer đỏ khi < 20% thời gian còn lại
- [ ] Timer = 0 → auto chuyển sang Result screen
- [ ] Result screen hiện điểm thật, không hardcode
- [ ] WordBank: click word → đặt vào slot → click slot → trả về bank
- [ ] ClickMap: click trên ảnh → validate hitbox thật
- [ ] Zero TypeScript errors sau khi fix `any` types
