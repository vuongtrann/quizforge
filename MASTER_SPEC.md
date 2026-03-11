# QuizForge — Master Specification
> **Tài liệu tổng thể duy nhất** — Product + Architecture + UI/UX
> Phiên bản: 3.0.0 — Merge từ PLAN_HUMAN_V2 + UI_DESIGN_SPEC
> *Đây là nguồn sự thật duy nhất (single source of truth) cho toàn dự án*

---

## MỤC LỤC

**PHẦN A — SẢN PHẨM & KIẾN TRÚC**
- A1. Tổng quan & Mục tiêu
- A2. Hai sản phẩm: Creator vs Player
- A3. Tech Stack đầy đủ
- A4. Monorepo Structure
- A5. Database Schema (SQLite)
- A6. File Format .qfz
- A7. Export Pipeline (tạo Player .exe)
- A8. Bảo mật — phân tích từng lớp
- A9. Mạng & Gửi kết quả — 3 kịch bản
- A10. Auto-update

**PHẦN B — TÍNH NĂNG CHI TIẾT**
- B1. 10 Loại câu hỏi
- B2. Lockdown Mode
- B3. Giám sát lớp học real-time
- B4. Danh sách học sinh
- B5. Branding & Logo

**PHẦN C — UI/UX DESIGN SYSTEM**
- C1. Phong cách & Định hướng thiết kế
- C2. Tech Stack UI
- C3. Design Tokens (màu, font, spacing)
- C4. Component Library

**PHẦN D — MÀN HÌNH CHI TIẾT**
- D1. Creator: Welcome Screen
- D2. Creator: Dashboard (2 tabs)
- D3. Creator: Quiz Editor + Ribbon
- D4. Creator: Question Editor Dialog
- D5. Creator: Quiz Properties (5 tabs)
- D6. Creator: Player Template Editor
- D7. Creator: Student List Manager
- D8. Creator: Export Player Dialog
- D9. Creator: Branding Settings
- D10. Player: Chọn Học Sinh
- D11. Player: Làm Bài
- D12. Player: Kết Quả
- D13. Player: Lockdown Visuals

**PHẦN E — TRIỂN KHAI**
- E1. Roadmap thực tế
- E2. Rủi ro & Giải pháp
- E3. UX Edge Cases
- E4. Performance Targets
- E5. Quyết định cần xác nhận

---

# PHẦN A — SẢN PHẨM & KIẾN TRÚC

## A1. Tổng quan & Mục tiêu

**Vấn đề**: Wondershare QuizCreator dùng Adobe Flash (khai tử 31/12/2020). Các phòng lab giáo dục tại Việt Nam đang bị kẹt với hệ thống không còn hoạt động.

**Giải pháp**: QuizForge — thay thế 1:1 toàn bộ tính năng, công nghệ hiện đại, không Flash.

**Triết lý cốt lõi**:
> Giáo viên không phải kỹ sư. Mọi thứ phải đơn giản đến mức không cần đọc hướng dẫn.

Hệ quả của triết lý này:
- Tất cả lỗi phải có thông báo tiếng Việt rõ ràng
- Export player phải là 1 click, không cần hiểu kỹ thuật
- Không bao giờ để app treo mà không có loading indicator
- UX familiar với người dùng Microsoft Office

---

## A2. Hai Sản Phẩm Trong Một Dự Án

| | QuizForge Creator | QuizForge Player |
|---|---|---|
| **Người dùng** | Giáo viên | Học sinh |
| **Cài đặt** | Có — Windows installer ~80MB | KHÔNG — chạy thẳng .exe |
| **Database** | SQLite tại %APPDATA%\QuizForge\ | Không có — data trong file |
| **Internet** | Chỉ để update | Không bắt buộc |
| **Security** | Bình thường | Cứng nhắc tối đa |
| **DevTools** | Cho phép khi dev | Khóa hoàn toàn production |
| **RAM target** | < 150MB | < 80MB |
| **File size** | Không quan trọng | < 30MB (online mode) |
| **Chạy ở đâu** | Máy giáo viên | Máy học sinh phòng lab |

**Lý do tách riêng**: Hai app có yêu cầu trái ngược hoàn toàn về security, database, và file size. Nhét chung vào 1 app → vừa nặng vừa không bảo mật được.

---

## A3. Tech Stack Đầy Đủ

### Creator App
| Layer | Technology | Lý do |
|---|---|---|
| Desktop runtime | Tauri 2 | Nhẹ, Rust backend, cross-platform |
| UI | React 18 + TypeScript + Vite | Ecosystem lớn, HMR nhanh |
| Routing | TanStack Router v1 | Type-safe, file-based |
| Data fetching | TanStack Query v5 | Cache, invalidation |
| Tables | TanStack Table v8 | Headless, flexible |
| Forms | TanStack Form + Zod | Type-safe validation |
| State | Zustand v4 | Nhẹ hơn Redux |
| Database | SQLite via tauri-plugin-sql | Built-in, zero config |
| Styling | **Tailwind CSS v3 + shadcn/ui** | Radix-based, accessible, lightweight |
| Icons | Lucide React | Tree-shakeable |
| Font | **Geist** | Vietnamese support tốt |
| Excel | SheetJS (xlsx) | Parse/export student lists |
| Validation | Zod | Schema validation toàn bộ |
| Rich Text | Tiptap v2 | WYSIWYG question editor |
| Drag & Drop | @dnd-kit | Matching, Sequence questions |
| Charts | Recharts | Dashboard thống kê |
| Packaging | 7-Zip SFX (thay NSIS) | Nhẹ hơn, đủ dùng |
| Updater | tauri-plugin-updater | GitHub Releases |
| Crypto | aes-gcm + pbkdf2 (Rust) | AES-256-GCM |

### Player Shell
| Layer | Technology |
|---|---|
| Runtime | Tauri 2 minimal |
| UI | React 18 + Vite (shared packages) |
| Network | reqwest (Rust) — HTTP submission |
| LAN | mdns-sd (Rust crate) |
| Security | Named Mutex, disable DevTools, hotkey hooks |

### Tại sao Tailwind + shadcn/ui, KHÔNG dùng Material UI hay Ant Design

| | Material UI | Ant Design | **Tailwind + shadcn** |
|---|---|---|---|
| Bundle size | ~300KB | ~500KB | **~50KB** |
| Customization | Khó | Khó | **Rất dễ** |
| Desktop feel | Mobile-centric | OK | **Tốt nhất** |
| Tauri compat | Có issue | Có issue | **Hoàn hảo** |
| Vietnamese font | OK | OK | **Full control** |

shadcn/ui không phải thư viện — là component code bạn copy vào project và sở hữu hoàn toàn. Không phụ thuộc version ngoài, không breaking changes.

### Versions cần pin chính xác
```json
{
  "@tauri-apps/api": "2.x",
  "react": "18.x",
  "vite": "5.x",
  "@tanstack/react-query": "5.x",
  "@tanstack/react-router": "1.x",
  "@tanstack/react-table": "8.x",
  "zustand": "4.x",
  "tailwindcss": "3.x",
  "zod": "3.x",
  "@tiptap/react": "2.x",
  "@dnd-kit/core": "6.x",
  "xlsx": "0.18.x"
}
```

---

## A4. Monorepo Structure

```
quizforge/
├── apps/
│   ├── creator/                  ← Tauri 2 + React Creator
│   │   ├── src/                  ← React source
│   │   │   ├── routes/           ← TanStack Router pages
│   │   │   ├── components/       ← App-specific components
│   │   │   ├── stores/           ← Zustand stores
│   │   │   └── hooks/
│   │   ├── src-tauri/            ← Rust backend
│   │   │   ├── src/
│   │   │   │   ├── commands/     ← Tauri commands (quiz, export, network)
│   │   │   │   ├── db/           ← SQLite operations
│   │   │   │   ├── crypto/       ← AES-256-GCM
│   │   │   │   ├── network/      ← LAN server, mDNS
│   │   │   │   └── bundler/      ← Player export pipeline
│   │   │   └── resources/        ← player.exe, 7zip-sfx.exe
│   │   └── package.json
│   │
│   └── player/             ← Tauri 2 minimal Player
│       ├── src/                  ← React player UI
│       └── src-tauri/            ← Rust player backend
│           └── src/
│               ├── commands/     ← validate_answer, submit_result
│               ├── lockdown/     ← hotkey hooks, fullscreen
│               └── network/      ← result submission
│
├── packages/
│   ├── types/                    ← Shared Zod schemas + TypeScript types
│   ├── ui/                       ← Shared shadcn/ui components
│   └── quiz-engine/              ← Shared quiz logic (scoring, timer)
│
├── tools/
│   └── release/                  ← GitHub Release automation scripts
│
├── .github/workflows/
│   ├── build-creator.yml
│   ├── build-player.yml
│   └── release.yml
│
├── pnpm-workspace.yaml
└── turbo.json
```

---

## A5. Database Schema (SQLite — Creator)

```sql
-- ─────────────────────────────────────────────────
-- QUIZZES
-- ─────────────────────────────────────────────────
CREATE TABLE quizzes (
    id               TEXT PRIMARY KEY,         -- UUID v4
    schema_version   TEXT NOT NULL DEFAULT '1.0.0',
    title            TEXT NOT NULL,
    author           TEXT,
    created_at       DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at       DATETIME NOT NULL DEFAULT (datetime('now')),
    information_json TEXT NOT NULL DEFAULT '{}', -- intro, title, author info
    settings_json    TEXT NOT NULL DEFAULT '{}', -- passing rate, timer, shuffle, lockdown
    result_json      TEXT NOT NULL DEFAULT '{}', -- feedback text, show stats
    security_json    TEXT NOT NULL DEFAULT '{}', -- password, domain restriction
    theme_json       TEXT NOT NULL DEFAULT '{}'  -- player template settings
);

-- ─────────────────────────────────────────────────
-- QUESTIONS (tất cả 10 loại dùng chung 1 bảng)
-- ─────────────────────────────────────────────────
CREATE TABLE questions (
    id                  TEXT PRIMARY KEY,
    quiz_id             TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type                TEXT NOT NULL, -- 'true_false'|'multiple_choice'|'multiple_response'
                                       -- |'fill_blank'|'matching'|'sequence'|'word_bank'
                                       -- |'click_map'|'short_essay'|'blank_page'
    order_index         INTEGER NOT NULL,
    rich_text_html      TEXT,          -- Tiptap HTML
    media_id            TEXT REFERENCES media_files(id) ON DELETE SET NULL,
    points_correct      INTEGER NOT NULL DEFAULT 10,
    points_incorrect    INTEGER NOT NULL DEFAULT 0,
    feedback_correct    TEXT NOT NULL DEFAULT 'Chính xác !',
    feedback_incorrect  TEXT NOT NULL DEFAULT 'Không chính xác !',
    feedback_mode       TEXT NOT NULL DEFAULT 'by_question', -- 'by_question'|'by_choice'
    attempts            INTEGER NOT NULL DEFAULT 1,
    branching_to        TEXT,          -- question id để nhảy đến
    question_group      TEXT,
    type_data_json      TEXT NOT NULL DEFAULT '{}'
    -- type_data_json structures per type:
    -- true_false:        { "correctAnswer": "true"|"false" }
    -- multiple_choice:   { "options": [{id,text,mediaId},...], "correctOptionId": "id", "shuffle": bool }
    -- multiple_response: { "options": [{id,text},...], "correctOptionIds": ["id",...], "shuffle": bool, "partialScoring": bool }
    -- fill_blank:        { "blanks": [{id, acceptedAnswers:[], caseSensitive:bool, trimWhitespace:bool},...] }
    -- matching:          { "pairs": [{id,choice,choiceMediaId,match,matchMediaId},...], "shuffle": bool, "displayMode": "dropdown"|"dragdrop" }
    -- sequence:          { "items": [{id,text},...] } -- stored in correct order
    -- word_bank:         { "blanks": [{id,correctWordId},...], "words": [{id,text,isDistractor:bool},...] }
    -- click_map:         { "imageMediaId": "id", "hotspots": [{id,x,y,w,h,shape,isCorrect},...] }
    -- short_essay:       { "referenceAnswer": "text", "keywords": [], "maxWords": null }
    -- blank_page:        { "title": "text", "contentHtml": "html" }
);
CREATE INDEX idx_questions_quiz ON questions(quiz_id, order_index);

-- ─────────────────────────────────────────────────
-- MEDIA FILES
-- ─────────────────────────────────────────────────
CREATE TABLE media_files (
    id          TEXT PRIMARY KEY,
    quiz_id     TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,  -- 'image'|'audio'|'video'
    filename    TEXT NOT NULL,
    mime_type   TEXT NOT NULL,
    file_path   TEXT NOT NULL,  -- relative to %APPDATA%\QuizForge\media\
    size_bytes  INTEGER NOT NULL DEFAULT 0,
    width       INTEGER,
    height      INTEGER,
    created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────
-- STUDENT LISTS
-- ─────────────────────────────────────────────────
CREATE TABLE student_lists (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    imported_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quiz_student_lists (
    quiz_id         TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_list_id TEXT NOT NULL REFERENCES student_lists(id) ON DELETE CASCADE,
    PRIMARY KEY (quiz_id, student_list_id)
);

-- Chỉ có STT, Tên, Lớp — không có MSSV, không có email
CREATE TABLE students (
    id          TEXT PRIMARY KEY,
    list_id     TEXT NOT NULL REFERENCES student_lists(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    class_name  TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────
-- QUIZ RESULTS
-- ─────────────────────────────────────────────────
CREATE TABLE quiz_results (
    id                    TEXT PRIMARY KEY,
    quiz_id               TEXT NOT NULL,
    quiz_title            TEXT NOT NULL,
    student_name          TEXT NOT NULL,
    class_name            TEXT,
    started_at            DATETIME NOT NULL,
    completed_at          DATETIME NOT NULL,
    time_spent_seconds    INTEGER NOT NULL DEFAULT 0,
    total_points          INTEGER NOT NULL,
    earned_points         INTEGER NOT NULL DEFAULT 0,
    percentage            REAL NOT NULL DEFAULT 0,
    passed                INTEGER NOT NULL DEFAULT 0,
    question_results_json TEXT NOT NULL DEFAULT '[]',
    machine_id            TEXT,
    submitted_via         TEXT NOT NULL DEFAULT 'local', -- 'http'|'lan'|'local'
    received_at           DATETIME NOT NULL DEFAULT (datetime('now')),
    notes                 TEXT
);
CREATE INDEX idx_results_quiz ON quiz_results(quiz_id);

-- ─────────────────────────────────────────────────
-- APP SETTINGS
-- ─────────────────────────────────────────────────
CREATE TABLE app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT OR IGNORE INTO app_settings VALUES
    ('result_server_url',          ''),
    ('lan_port',                   '41235'),
    ('heartbeat_port',             '41236'),
    ('auto_update',                'true'),
    ('update_endpoint',            ''),
    ('theme',                      'light'),
    ('language',                   'vi'),
    ('default_passing_rate',       '95'),
    ('default_points_correct',     '10'),
    ('default_points_incorrect',   '0'),
    ('default_feedback_correct',   'Chính xác !'),
    ('default_feedback_incorrect', 'Không chính xác !'),
    ('media_max_size_mb',          '50'),
    ('branding_org_name',          ''),
    ('branding_website',           ''),
    ('branding_app_name',          'QuizForge Creator'),
    ('branding_bg_color',          '#eff6ff');

-- ─────────────────────────────────────────────────
-- SCHEMA MIGRATIONS
-- ─────────────────────────────────────────────────
CREATE TABLE schema_migrations (
    version    INTEGER PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
```

---

## A6. File Format .qfz

**.qfz = ZIP archive** chứa JSON + media files.

```
quiz_tenchuong1.qfz
├── manifest.json
│     { "quizforgeVersion":"1.0.0", "schemaVersion":"1.0.0",
│       "quizId":"uuid", "exportedAt":"ISO8601",
│       "mediaCount":5, "questionCount":39 }
├── quiz.json          ← metadata + settings (không có questions)
├── questions.json     ← tất cả câu hỏi (không có media blob)
├── students.json      ← danh sách học sinh (optional)
├── theme.json         ← player template settings
└── media/
    ├── img_<uuid>.webp    ← tất cả ảnh convert sang WebP (giảm 80% size)
    ├── audio_<uuid>.mp3
    └── video_<uuid>.mp4
```

**Tại sao tách quiz.json và questions.json**: Dashboard chỉ cần đọc quiz.json để hiển thị list, không cần load 39 câu hỏi. Tiết kiệm RAM.

**Media WebP conversion**: PNG/JPG upload → Rust `image` crate → convert WebP 85% quality tự động.

---

## A7. Export Pipeline (Tạo Player .exe)

### Bước 1 — Chuẩn bị quiz.dat

```
1. Đọc quiz từ SQLite
2. Serialize → JSON
3. Tách thành 2 phần:
   display_json:  question text, options text, media refs  (không có answers)
   answers_json:  correct answers, points, feedback        (bí mật)
4. Encrypt answers_json bằng AES-256-GCM
   Key = PBKDF2-SHA256(quiz_id + creation_timestamp, random_salt, 100000 iterations)
   Nonce = random 12 bytes
5. quiz.dat = [salt 16B][nonce 12B][encrypted_answers][display_json_b64]
```

### Bước 2 — Chuẩn bị students.dat

```
1. Serialize student list → JSON
2. Encrypt toàn bộ (học sinh không cần đọc)
```

### Bước 3 — Bundle với 7-Zip SFX

```
Creator (Rust):
1. Lấy player.exe từ embedded resources
2. Tạo temp dir: %TEMP%\quizforge_export_<uuid>\
3. Copy vào: player.exe, quiz.dat, students.dat, webview2_bootstrapper.exe
4. Generate config.txt cho 7-Zip SFX
5. Chạy 7zSD.sfx + config.txt + archive.7z → QuizName_Player.exe
6. Clean up temp dir
7. Output: [thư mục giáo viên chọn]\QuizName_Player.exe
```

### WebView2 Strategy

```
Player.exe khi chạy:
1. Kiểm tra WebView2 đã cài chưa (registry check)
2. Đã có → khởi động thẳng
3. Chưa có → chạy WebView2 bootstrapper (2MB, đã nhúng sẵn)
   - Bootstrapper download ~150MB từ Microsoft CDN → cài silent
   - Cần internet → nếu không có internet → báo lỗi rõ ràng
4. Giáo viên chọn "Offline bundle" → nhúng WebView2 Fixed Runtime (~150MB)
   → không cần internet, chạy được mọi máy Windows 10+
```

---

## A8. Bảo Mật — Phân Tích Từng Lớp

**Lớp 1 — Answers không bao giờ trong DOM/JS**
```
JavaScript chỉ biết: question text, options display text
Học sinh chọn → invoke Tauri command → Rust validate với answers đã decrypt
Rust trả về: { isCorrect: bool, points: int, feedback: string }
→ Không có cách nào lấy đáp án từ browser DevTools
```

**Lớp 2 — DevTools bị khóa trong production**
```rust
#[cfg(not(debug_assertions))]
// Disable F12, Ctrl+Shift+I, Ctrl+U qua JS + Tauri config
```

**Lớp 3 — Named Mutex ngăn mở 2 lần**
```
Mutex name: "Global\QuizForge_Player_<quiz_id>"
→ Cùng quiz không mở 2 lần
→ Quiz khác nhau có thể mở song song
```

**Lớp 4 — AES-256-GCM encryption**
```
Key: PBKDF2-SHA256(quiz_id + timestamp, salt, 100000 iterations) → 32 bytes
Authenticated encryption → phát hiện tamper
Không dùng machine fingerprint → file chạy được trên nhiều máy
```

**Lớp 5 — Right-click disabled trong Player**

**Lớp 6 — Lockdown Mode** (xem mục B2)

---

## A9. Mạng & Gửi Kết Quả — 3 Kịch Bản

### Kịch bản 1: HTTP (có internet)
```
Player → HTTPS POST /api/results → Web Server
Retry: ngay → +3s → +10s → fail → fallback LAN
Body: { quizId, studentName, class, answers, score, timeSpent, ... }
```

### Kịch bản 2: LAN (NetSupport chặn internet)
```
Discovery:
  1. mDNS: _quizforge._tcp.local → timeout 5s
  2. UDP broadcast port 41234 → timeout 3s
  3. Fail → UI "Nhập địa chỉ IP giáo viên:"

Submit: TCP connect → ip:41235 → send JSON → receive "OK"

Creator LAN Server:
  - TCP server port 41235 (kết quả cuối)
  - TCP server port 41236 (heartbeat real-time)
  - Tokio async: handle 30 concurrent connections
  - Mỗi kết quả nhận được: lưu SQLite + emit event lên React UI
```

### Kịch bản 3: Offline hoàn toàn
```
Player:
  1. Lưu result_<name>_<timestamp>.json ra Desktop
  2. Thông báo: "Không thể gửi. File đã lưu tại [path]"

Creator:
  - Import result file: giáo viên kéo .json vào → import
```

### Heartbeat Protocol (Player → Creator mỗi 10 giây)
```json
{
  "type": "heartbeat",
  "quizId": "uuid",
  "studentName": "Nguyen Van An",
  "class": "10A1",
  "completionPercent": 75,
  "currentQuestion": 30,
  "totalQuestions": 39,
  "tabOutCount": 0,
  "windowFocused": true,
  "timestamp": "ISO8601"
}
```

```json
{
  "type": "tab_out_event",
  "studentName": "Le Van Cuong",
  "timestamp": "ISO8601",
  "tabOutCount": 2
}
```

---

## A10. Auto-Update

```
App startup → background check (async, không block UI):
  GET https://server/api/updates/windows-x86_64/<current-version>
  → { latestVersion, notes, url, signature }

Nếu có bản mới → toast notification:
  "Có phiên bản mới 1.1.0. [Xem chi tiết] [Cập nhật ngay] [Để sau]"

Download in background → "Tải xong. Khởi động lại? [Ngay] [Để sau]"
Restart → app mới

Signature: ed25519 (Tauri updater yêu cầu)
Host: GitHub Releases (Phase 1), tự host (Phase 3)
```

---

# PHẦN B — TÍNH NĂNG CHI TIẾT

## B1. 10 Loại Câu Hỏi

### B1.1 True/False
- Statement + True/False choice
- Optional media (image/audio/video)
- Điểm riêng cho đúng/sai
- Feedback riêng cho đúng/sai
- Player: 2 nút lớn Đúng / Sai, keyboard: 1/2 chọn, Enter nộp

### B1.2 Multiple Choice (Một lựa chọn)
- 2–10 lựa chọn, radio button
- Shuffle answers option
- Feedback per choice (advanced) hoặc per question (basic)
- Mỗi choice có thể có media riêng
- Validation: phải có đúng 1 correct answer khi save

### B1.3 Multiple Response (Nhiều lựa chọn)
- 2–10 lựa chọn, checkbox
- Scoring modes:
  - **All correct**: phải chọn đúng hết, không thừa thiếu
  - **Partial**: mỗi lựa chọn đúng = 1 phần điểm, chọn sai bị trừ
- Partial logic: `points = max(0, (correct_chosen - wrong_chosen) / total_correct * max_points)`

### B1.4 Fill in the Blank
- Câu văn trong Tiptap với custom node `<blank id="uuid">`
- Mỗi blank: list of acceptable answers, caseSensitive, trimWhitespace
- Player: text input tại vị trí blank, Tab di chuyển giữa các blank

### B1.5 Matching
- Tối thiểu 2 cặp, tối đa 10
- Choice và Match đều có thể là text hoặc image
- Display mode: **Drag&Drop** (mặc định) hoặc **Dropdown** (giáo viên chọn)
- Shuffle cả 2 cột

### B1.6 Sequence
- Items nhập theo đúng thứ tự trong Creator
- Player shuffle → học sinh kéo về đúng thứ tự
- Drag handles (@dnd-kit)

### B1.7 Word Bank
- Câu văn có blank slots + pool of words (đáp án đúng + distractors)
- Player: drag từ bank vào slot, hoặc click từ rồi click slot
- Từ đã dùng biến mất khỏi bank (trừ khi drag ra để hoàn trả)

### B1.8 Click Map
- Upload ảnh, vẽ hotspot (rect/circle) trên Canvas editor
- Hotspot: đúng hoặc sai
- Hotspot chồng nhau: z-index theo thứ tự vẽ (vẽ sau = ưu tiên)
- Player: click vào ảnh → detect hotspot → validate

### B1.9 Short Essay
- Textarea tự do, optional max words
- Điểm mặc định 0 → cần giáo viên chấm thủ công
- Reference answer lưu trong Creator để giáo viên đối chiếu
- Dashboard hiển thị badge "X bài cần chấm Short Essay"

### B1.10 Blank Page
- Trang thông tin, không phải câu hỏi
- Title + rich text + optional media
- Không tính điểm, không tính số câu
- Timer vẫn chạy (nếu bật)

---

## B2. Lockdown Mode

### Giáo viên cài đặt (Quiz Properties → Tab Settings)
```
[✓] Bật Lockdown Mode (Khóa màn hình khi làm bài)

Khi bật, học sinh:
  • Không thể thoát khi chưa hết giờ / chưa nộp
  • Không Alt+Tab, Win key, Ctrl+Esc
  • Luôn fullscreen, không resize
  • Mọi cố thoát được ghi log, gửi về giáo viên

Cho phép thoát khi:
  ● Hết thời gian làm bài
  ○ Nộp bài xong
  ○ Cả hai
```

### Kỹ thuật (Rust — Player)
```rust
// Fullscreen bắt buộc
window.set_fullscreen(true);
window.set_always_on_top(true);
window.set_decorations(false);

// Chặn system hotkeys (Windows API)
// Alt+F4, Alt+Tab, Win, Ctrl+Esc, Win+D, Win+L, Win+M
register_system_hotkey_hooks();

// Override close event
window.on_window_event(|event| {
    if WindowEvent::CloseRequested && !can_exit() {
        event.prevent_close();
        send_exit_attempt_to_creator();
    }
});
```

### Phím bị chặn
| Phím | Kết quả khi Lockdown |
|---|---|
| Alt+F4 | Không có tác dụng |
| Alt+Tab | Không có tác dụng |
| Win / Win+D | Không có tác dụng |
| Ctrl+Esc | Không có tác dụng |
| Win+L | Không có tác dụng |
| F11 | Không có tác dụng (luôn fullscreen) |
| **Ctrl+Alt+Del** | **Không chặn được** — Windows không cho phép app thường chặn tổ hợp này. Khi học sinh nhấn: màn hình lock/task manager hiện, nhưng khi quay lại Player vẫn chạy, và sự kiện tab-out được ghi log gửi về giáo viên. |

### Tab-out detection (áp dụng cả khi Lockdown tắt)
- Windows `SetWinEventHook` để detect khi cửa sổ mất focus
- Ghi log: thời điểm + số lần
- Gửi `tab_out_event` về Creator ngay lập tức (TCP port 41236)
- Giáo viên thấy cảnh báo đỏ trong bảng giám sát

---

## B3. Giám Sát Lớp Học Real-time

**Điều kiện**: Giáo viên phải bật "Giám sát" TRƯỚC khi phát file cho học sinh.

Khi bật: Creator mở 2 TCP server:
- Port **41235**: nhận kết quả cuối (submit)
- Port **41236**: nhận heartbeat + tab-out events

Player tự tìm Creator qua mDNS, sau đó:
- Gửi heartbeat mỗi 10 giây lên port 41236
- Gửi kết quả cuối lên port 41235 sau khi nộp bài

Dữ liệu hiển thị real-time trong Dashboard Tab 2:

| Cột | Nguồn | Tần suất |
|---|---|---|
| Họ tên | Khi kết nối | 1 lần |
| Lớp | Khi kết nối | 1 lần |
| IP máy | TCP connection | 1 lần |
| % Hoàn thành | Heartbeat | Mỗi 10 giây |
| Điểm | Khi nộp bài | 1 lần |
| Trạng thái | Heartbeat + events | Real-time |

Trạng thái học sinh: **Chờ** / **Đang làm** / **⚠️ TAB ra** / **✅ Đã nộp** / **🔴 Mất kết nối** (timeout >30s)

---

## B4. Danh Sách Học Sinh

**Template Excel** (chỉ 4 cột):
```
STT | Họ và Tên     | Lớp  | Điểm
 1  | Nguyễn Văn An | 10A1 |      ← Điểm để trống, tự điền khi xuất kết quả
```

**Flow**:
1. Giáo viên download template → điền → import vào Creator
2. Validate: Tên bắt buộc, Lớp optional, tên trùng → cảnh báo không block
3. Lưu vào SQLite `students` table
4. Khi export player: đính kèm encrypted vào player .exe
5. Player hiển thị dropdown: "Nguyễn Văn An (10A1)"
6. Kết quả gắn với Tên + Lớp
7. Creator xuất Excel: cột Điểm tự điền

---

## B5. Branding & Logo

Giáo viên/trường có thể customize:
- **Logo**: PNG/JPG/SVG, 200×200px khuyến nghị
- **Tên app**: Hiển thị trên title bar và welcome screen
- **Background welcome**: Màu đơn / Gradient / Ảnh
- **Thông tin tổ chức**: Tên trường, website (hiển thị footer welcome screen)

Logo xuất hiện tại:
- Welcome Screen (góc trên trái)
- Quiz Editor (ribbon)
- Player Template (default logo, giáo viên có thể override per-quiz)
- File Player.exe (icon file)

Lưu trữ: SQLite `app_settings` + file `%APPDATA%\QuizForge\branding\logo.png`

---

# PHẦN C — UI/UX DESIGN SYSTEM

## C1. Phong Cách & Định Hướng

**Phong cách**: "Professional Education — Modern Desktop"

Không phải Material (quá mobile), không phải Bootstrap (quá generic web).
Là Desktop Application Professional — giống VS Code, Notion, Linear nhưng **thân thiện hơn cho giáo viên**.

Tham chiếu lấy cảm hứng (không copy):
- VS Code → panel layout, tree view, status bar
- Microsoft Office → ribbon toolbar, dialog patterns
- Notion → clean typography, card design
- Linear → color system, subtle shadows

**KHÔNG làm**:
- ❌ Gradient tím/hồng phong cách "AI startup"
- ❌ Dark mode mặc định
- ❌ Rounded corners quá nhiều (trông mobile)
- ❌ Icon-only buttons (giáo viên cần text)
- ❌ Màu sắc sặc sỡ

---

## C2. Tech Stack UI

```
Styling:    Tailwind CSS v3 (utility-first)
Components: shadcn/ui (Radix UI primitives — copy vào project, không phụ thuộc)
Icons:      Lucide React
Font:       Geist + Be Vietnam Pro (fallback Vietnamese)
Rich text:  Tiptap v2
DnD:        @dnd-kit
Charts:     Recharts
Tables:     TanStack Table v8
Animation:  Tailwind animate + CSS transitions (nhẹ, purposeful)
```

---

## C3. Design Tokens

### Colors
```css
:root {
  /* Brand (Blue) */
  --brand-50:  #eff6ff;  --brand-500: #3b82f6;
  --brand-600: #2563eb;  --brand-700: #1d4ed8;

  /* Neutral (Slate — warm gray) */
  --gray-50:  #f8fafc;   --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;   --gray-300: #cbd5e1;
  --gray-500: #64748b;   --gray-700: #334155;
  --gray-900: #0f172a;

  /* Semantic */
  --success: #16a34a;
  --warning: #d97706;
  --danger:  #dc2626;

  /* Surfaces */
  --bg-app:     #f8fafc;
  --bg-surface: #ffffff;
  --bg-subtle:  #f1f5f9;
  --border:     #e2e8f0;
}
```

### Typography
```
Font:    Geist / Be Vietnam Pro (fallback)
Scale:   xs=11 sm=13 base=15 lg=17 xl=20 2xl=24 3xl=30
Weight:  normal=400 medium=500 semibold=600 bold=700
```

### Spacing (4px base)
```
1=4  2=8  3=12  4=16  5=20  6=24  8=32  10=40  12=48  16=64
```

### Border Radius
```
rounded=4  rounded-md=6  rounded-lg=8  rounded-xl=12  rounded-full=9999
```

---

## C4. Component Library

### Buttons
```
Primary:   bg-brand-600 text-white  hover:bg-brand-700
Secondary: bg-white border          hover:bg-gray-50
Ghost:     transparent text-gray-600 hover:bg-gray-100
Danger:    bg-red-600 text-white    hover:bg-red-700
Sizes: sm(h-8 px-3 text-sm) | md(h-9 px-4) | lg(h-10 px-6)
```

### Input / Select / Textarea
```
Normal:   border-gray-300 rounded h-9
Focus:    border-brand-500 ring-2 ring-brand-100
Error:    border-red-500 ring-2 ring-red-100 + error text below
Disabled: bg-gray-100 cursor-not-allowed
```

### Badge/Status
```css
/* Question type badges */
TF:    bg-green-50  text-green-600
MC:    bg-blue-50   text-blue-600
MR:    bg-purple-50 text-purple-600
FITB:  bg-orange-50 text-orange-600
Match: bg-teal-50   text-teal-600
Seq:   bg-indigo-50 text-indigo-600
WB:    bg-pink-50   text-pink-600
CM:    bg-red-50    text-red-600
Essay: bg-yellow-50 text-yellow-600
Blank: bg-gray-50   text-gray-600

/* Monitor status badges */
waiting:   bg-gray-100  text-gray-600
working:   bg-blue-100  text-blue-700
tabout:    bg-amber-100 text-amber-700
submitted: bg-green-100 text-green-700
lost:      bg-red-100   text-red-700
```

### Dialog / Modal
```
Overlay: bg-black/50 backdrop-blur-sm
Dialog: bg-white rounded-xl shadow-xl
Animation: fade-in + scale 95%→100% + translateY -8px→0
Width: sm=480px md=640px lg=900px
```

### Toast Notification
```
Position: bottom-right, stacked, max 5
Duration: 4 giây tự dismiss
Animation: slide-in từ phải
Types: success(green) / warning(amber) / error(red) / info(blue)
```

### Ribbon Toolbar
```
Height: 80px
Background: bg-gray-50 border-b border-gray-200
Groups: separated by border-r border-gray-200
Button: flex-col items-center gap-1 min-w-[60px] p-2
        hover:bg-gray-100 rounded-md
Icon: w-6 h-6 text-gray-600
Label: text-xs text-gray-500
```

### Status Bar
```
Height: 24px
Background: bg-gray-100 border-t border-gray-200
Font: text-xs text-gray-500
Sections: separated by border-r border-gray-300 px-3
```

---

# PHẦN D — MÀN HÌNH CHI TIẾT

## D1. Creator: Welcome Screen

**Cửa sổ**: 700×500px, cố định (không resize), centered on screen.
**Background**: gradient nhẹ `from-brand-50 to-white`

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo 32px]  QuizForge Creator                         [– □ ×]     │  ← Title bar 32px
├──────────────────────────────┬───────────────────────────────────────┤
│                              │                                       │
│   Tạo quiz mới               │   Tạo survey mới                     │
│   ─────────────────          │   ─────────────────                  │
│   [📝] Tạo Quiz mới          │   [📋] Tạo survey mới                │
│   [📄] Từ Word               │                                       │
│   [📊] Từ Excel              │   Mở survey có sẵn                   │
│                              │   ─────────────────                  │
│   Mở quiz có sẵn             │   [📂] Browse...                     │
│   ─────────────────          │                                       │
│   [📂] Browse...             │                                       │
│   [📄] Import từ Word        │                                       │
│   [📊] Import từ Excel       │                                       │
│                              │                                       │
├──────────────────────────────┴───────────────────────────────────────┤
│  [fb] [tw] [Xem mẫu] [Hỗ trợ]           [Logo cty] [Tên trường]    │  ← Footer 40px
└──────────────────────────────────────────────────────────────────────┘
```

**CSS chi tiết**:
```css
.welcome-menu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; border-radius: 6px;
  cursor: pointer; font-size: 13px; color: #334155;
}
.welcome-menu-item:hover { background: #eff6ff; color: #1d4ed8; }
.welcome-section-header {
  font-size: 11px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 8px 16px 4px;
}
.welcome-divider { border-right: 1px solid #e2e8f0; }
.welcome-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; }
```

---

## D2. Creator: Dashboard (2 tabs)

**Layout**: Fullscreen app window.

### Tab Bar
```
┌─────────────────────────────────────────────────────┐
│  [Logo]  QuizForge Creator         [Cài đặt] [👤]   │  ← App header 44px
├─────────────────────────────────────────────────────┤
│  [📝 Quản lý Quiz]  [📡 Giám sát lớp học]           │  ← Tab bar 40px
└─────────────────────────────────────────────────────┘
Tab active: border-b-2 border-brand-600 text-brand-700 font-medium
Tab inactive: text-gray-500 hover:text-gray-700
```

### Tab 1: Quản lý Quiz
```
[+ Tạo Quiz]  [Mở .qfz]        [🔍 Tìm kiếm...]      [Lưới|Danh sách]

── Quiz gần đây ──────────────────────────────────────────────────
[Card] [Card] [Card]

── Tất cả ────────────────────────────  Sắp xếp: [Ngày sửa ▼]
[TanStack Table: STT | Tên | Câu hỏi | Ngày tạo | Ngày sửa | Actions]
```

**Quiz Card (Grid view)**:
```css
.quiz-card {
  width: 220px; background: white; border-radius: 8px;
  border: 1px solid #e2e8f0; padding: 16px;
  cursor: pointer; transition: all 150ms;
}
.quiz-card:hover {
  border-color: #93c5fd; box-shadow: 0 4px 12px rgba(59,130,246,0.1);
  transform: translateY(-1px);
}
```

### Tab 2: Giám sát lớp học
```
HEADER:
  ● ĐANG LẮNG NGHE  [Dừng]   IP: 192.168.1.105  Port: 41235,41236
  Quiz: [Chủ đề 1 ▼]                    [Làm mới] [Xuất Excel]

STATS ROW (4 cards):
  [28 Tổng HS]  [5 Đã nộp/green]  [21 Đang làm/blue]  [2 TAB!/amber]

TABLE (TanStack, real-time update):
  STT | Họ tên | Lớp | IP | [Progress Bar] % | Điểm | [Status Badge]

  Row có TAB! → bg-amber-50
  Row Đã nộp → bg-green-50 (subtle)

LOG PANEL (collapsible, default collapsed):
  [▼ Log cảnh báo (2)]
  ⚠️ 14:35:22 — Lê Văn Cường đã TAB ra khỏi bài (lần 2)
```

**Progress bar in cell**:
```css
/* Wrapper */
.progress-cell { display: flex; align-items: center; gap: 8px; }
/* Track */
.progress-track { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; }
/* Fill */
.progress-fill  { height: 100%; background: #3b82f6; border-radius: 3px; transition: width 500ms; }
```

---

## D3. Creator: Quiz Editor + Ribbon

**Layout**: Fullscreen, min 1024×768px.

```
TITLE BAR: [Logo 24px]  Quiz title*  [QuizForge Creator]   [– □ ×]  ← 32px

TAB BAR:   [Home]  [Help]                                    [? Help] ← 28px

RIBBON:                                                                 ← 80px
  ┌────────┐  ┌──────────────────────────────┐  ┌─────────────┐  ┌──────────────┐
  │Question│  │       Settings               │  │  Publish    │  │   Results    │
  │   ↓    │  │                              │  │             │  │              │
  │[icon]  │  │ [QuizProp]   [PlayerTemplate]│  │ [Preview]   │  │ [ManageRes↓] │
  │Question│  │ Quiz Props   Player Template │  │ [Publish]   │  │ Manage Res   │
  └────────┘  └──────────────────────────────┘  └─────────────┘  └──────────────┘
    New                  Settings                   Publish           Results

MAIN AREA:
  ┌─────────────────┐  ┌──────────────────────────────────────────────────────┐
  │ SIDEBAR (140px) │  │ CONTENT (flex-1)                                     │
  │                 │  │                                                      │
  │ ▼ New Quiz      │  │  Sort: [By type ▼]       [+ Add Question]           │
  │  • T/F  (0)     │  │  ─────────────────────────────────────────────────  │
  │  • MC   (0)     │  │  ID │ Type  │ Question       │ Feedback │ Pts │ ... │
  │  • MR   (0)     │  │  ── │ ───── │ ─────────────  │ ──────── │ ─── │     │
  │  • FITB (0)     │  │     │       │ [empty state]              │     │     │
  │  • Match(0)     │  │                                                      │
  │  • Seq  (0)     │  │                                                      │
  │  • WB   (0)     │  │                                                      │
  │  • CM   (0)     │  │                                                      │
  │  • Essay(0)     │  │                                                      │
  │  • Blank(0)     │  │                                                      │
  └─────────────────┘  └──────────────────────────────────────────────────────┘

STATUS BAR: Quiz: Tên Quiz │ Câu hỏi: 0 │ Đậu: 95% │ Tổng: 0 pts   ← 24px
```

**Question type icons trong bảng**:
```
TF    → CheckSquare  (green-600)
MC    → CircleDot    (blue-600)
MR    → CheckSquare  (purple-600)
FITB  → TextCursor   (orange-600)
Match → ArrowLeftRight (teal-600)
Seq   → ListOrdered  (indigo-600)
WB    → BookOpen     (pink-600)
CM    → MousePointer (red-600)
Essay → FileText     (yellow-600)
Blank → FileBlank    (gray-600)
```

---

## D4. Creator: Question Editor Dialog

**Layout**: Modal 900px × max-85vh, scrollable.

```
HEADER: [Question type label]                                    [×]  ← 44px

TOOLBAR ROW 1 (40px):
  [Font▼][Size▼] [B][I][U][S][A▼]  |  [★Score▼] [💬Feedback▼] [📝Note]
                                    |  [Attempts:1▲▼] [Branch▼]

TOOLBAR ROW 2 (36px — Insert):
  [🖼 Image][🔊 Sound][🎬 Movie][∑ Equation]        [Spell][Preview]

CONTENT AREA:
  ┌─────────────────────────────────────────┐  ┌──────────────────┐
  │ Tiptap rich text editor (min-h: 80px)  │  │ Media preview    │
  │                                         │  │ (drop zone)      │
  └─────────────────────────────────────────┘  └──────────────────┘

CHOICES (varies by type):
  For MC/MR: grid 40px-60px-1fr-32px per row
  Radio/Checkbox | Label | Text input | Delete btn

FEEDBACK AREA:
  Đúng:  [text          ] [More...]  [10 ▲▼]
  Sai:   [text          ] [More...]  [0  ▲▼]

FOOTER (52px):
  [← Prev]  [Next →]  [+ New]                    [OK]  [Cancel]
```

---

## D5. Creator: Quiz Properties (5 tabs)

**Layout**: Modal 700px, left navigation sidebar 160px.

**Navigation items** (active: `border-l-2 border-brand-600 bg-brand-50 text-brand-700`):
1. Thông tin Quiz
2. Cài đặt Quiz (bao gồm Lockdown Mode)
3. Kết quả Quiz
4. Cài đặt Câu hỏi
5. Khác (password, domain restriction)

**Tab 2 bổ sung Lockdown**:
```
─── Chế độ kiểm tra nghiêm ngặt ────────────────────────────
[✓] Bật Lockdown Mode

Khi bật: Không Alt+Tab, không thoát, fullscreen bắt buộc,
         mọi cố thoát được ghi log về giáo viên.

Cho phép thoát khi:
● Hết thời gian  ○ Nộp bài  ○ Cả hai
```

---

## D6. Creator: Player Template Editor

**Layout**: Cửa sổ 1100px, split panel 300px + 800px.

```
HEADER: [Template tab] [Layout tab]                              [×]
TOOLBAR: [💾] | [Themes gallery: thumb1 thumb2 thumb3] | [Colors][BG][Sound]

LEFT PANEL (300px):
  ─ Màu sắc ──────────────────────
  Primary:   [🎨 color picker]
  Background:[🎨 color picker]
  Text:      [🎨 color picker]

  ─ Font ─────────────────────────
  Font: [Geist ▼]   Size: [slider]

  ─ Progress ─────────────────────
  ● Bar  ○ Dots  ○ Number

  ─ Navigation ───────────────────
  ● Buttons  ○ Sidebar  ○ Floating

  [✓] Bo góc    [✓] Hiện timer

RIGHT PANEL (800px) — Live preview:
  [Player mockup cập nhật real-time]
  [▶️ Preview Full Screen]
```

---

## D7. Creator: Student List Manager

**Layout**: Modal 640px.

```
HEADER: Danh sách học sinh                                       [×]

  [Download template Excel]    [Import Excel]

  Danh sách: [Lớp 10A1 HK2/2025 ▼]  [Đổi tên]
  [✓] Gắn với quiz đang mở

TABLE:
  STT │ Họ và Tên               │ Lớp    │ Điểm
  ────┼─────────────────────────┼────────┼──────
   1  │ Nguyễn Văn An           │ 10A1   │   -
   2  │ Trần Thị Bình           │ 10A1   │   -
   3  │ Lê Văn Cường ⚠️         │ 10A1   │   -
      │ Tên không được trống    │        │

  Tổng: 35 học sinh · 1 lỗi

FOOTER: [Xóa danh sách]                        [Lưu] [Hủy]
```

---

## D8. Creator: Export Player Dialog

**Layout**: Modal 560px.

```
HEADER: Xuất file Player                                         [×]

  ┌ Quiz info card (bg-gray-50 rounded-lg) ──────────────────────────┐
  │ Chủ đề 1 - Căn bản về công nghệ                                 │
  │ 39 câu hỏi · 390 điểm · Không giới hạn thời gian               │
  └─────────────────────────────────────────────────────────────────┘

  ─ Chế độ xuất ─────────────────────────────────────────────────
  ● Nhẹ (~27MB) — cần internet để cài WebView2 nếu chưa có
  ○ Offline (~180MB) — chạy được mọi máy, không cần internet

  ─ Gửi kết quả ─────────────────────────────────────────────────
  URL: [https://                               ]

  ─ Danh sách học sinh ──────────────────────────────────────────
  [✓] Đính kèm   [Lớp 10A1 HK2/2025 ▼]

  ─ Output ──────────────────────────────────────────────────────
  Tên:    [ChuDe1_CanBan_Player.exe          ]
  Thư mục:[C:\Users\Desktop              ][Browse]

FOOTER: [Hủy]                                     [Xuất file ngay]

── Progress Dialog (sau khi click Xuất) ──────────────────────────
  Đang xuất file Player...
  [████████████░░░░░░░░] 55%
  ✅ Kiểm tra dữ liệu   ✅ Mã hóa   ⏳ Đóng gói...   ○ Tạo file
  Ước tính còn: ~15 giây
```

---

## D9. Creator: Branding Settings

**Layout**: Modal 560px.

```
HEADER: Cài đặt Thương hiệu                                      [×]

  ─ Logo ─────────────────────────────────────────────────────────
  [Logo preview 80×80]  PNG/JPG/SVG, đề nghị 200×200px
  [Chọn ảnh...]  [Xóa, dùng mặc định]

  ─ Tên ứng dụng ─────────────────────────────────────────────────
  [QuizForge Creator                                             ]

  ─ Background Welcome Screen ─────────────────────────────────────
  ● Màu đơn  ○ Gradient  ○ Ảnh
  [🎨 #eff6ff]

  ─ Thông tin tổ chức ─────────────────────────────────────────────
  Tên:     [Trường THPT Nguyễn Du                              ]
  Website: [https://                                           ]

  ─ Xem trước (live preview nhỏ) ─────────────────────────────────
  [Welcome screen preview 400×180px]

FOOTER: [Reset mặc định]                          [Lưu] [Hủy]
```

---

## D10. Player: Chọn Học Sinh

**Layout**: 640×480px cố định, centered.
**Background**: Gradient từ theme quiz (`from-brand-900 to-brand-700` mặc định).

```
┌─────────────────────────────────────────────────────────────┐  640px
│  [Logo]                                                     │  ← Header 56px (brand bg)
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  (White card centered, rounded-2xl shadow-2xl p-8)         │
│                                                             │
│     📝  Chủ đề 1 - Căn bản về công nghệ                   │  ← text-2xl bold
│          39 câu hỏi · 390 điểm                             │  ← text-gray-500
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🔍  Tìm tên học sinh...                              │  │  ← Search
│  ├───────────────────────────────────────────────────────┤  │
│  │  Lê Văn Cường              10A1                       │  │  ← List item: hover bg-brand-50
│  │  Nguyễn Thị Dung           10A1   ← selected         │  │  ← selected: bg-brand-100
│  │  Phạm Văn Em               10A1                       │  │  max-height: 200px overflow-y-auto
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [        Bắt đầu làm bài →        ]                       │  ← h-12 w-full bg-brand-600 rounded-xl
│   (disabled + opacity-50 khi chưa chọn)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

*Kịch bản không có danh sách*: Thay list = 2 input fields: Họ tên + Lớp.

---

## D11. Player: Màn Hình Làm Bài

**Layout**: Fullscreen (Lockdown) hoặc maximized window.

```
HEADER (56px — brand color):
  [Logo]  Chủ đề 1 - Căn bản          [🔒 KIỂM TRA]   Nguyễn Văn An | ⏱ 32:15

PROGRESS (36px — bg-white border-b):
  ▶ Câu 3 / 39  ·  Multiple Choice  ·  10 điểm
  [████████░░░░░░░░░░░░░░░░░░░░░] 7.7%

QUESTION AREA (flex-1 — bg-gray-50):
  padding: 40px 10% (responsive centering)
  max-width: 800px, mx-auto

  Question text (text-xl leading-relaxed)
  [Optional: image on right, max 240×180px]

  Choice items (max-width 640px):
  ┌────────────────────────────────────────────────┐
  │  ○   A. Ổ đĩa cứng                             │  ← border-2 rounded-xl p-4
  └────────────────────────────────────────────────┘
  (hover: border-brand-400 bg-brand-50)
  (selected: border-brand-500 bg-brand-100)
  (correct after submit: border-green-500 bg-green-50)
  (wrong-selected: border-red-500 bg-red-50)

FEEDBACK BAR (animated slide down, 52px):
  ✅ Chính xác! +10 điểm  /  Đáp án: A. Ổ đĩa cứng
  (bg-green-50 border-b border-green-200) hoặc (bg-red-50 border-red-200)

FOOTER (64px — bg-white border-t):
  [← Câu trước]          [📋 Dàn bài]          [Nộp câu →]
```

**Outline Panel** (slide từ trái, 280px overlay):
```
bg-white shadow-xl rounded-r-xl
  Dàn bài  [×]
  ──────────────────
  ✅  1. T/F     (done, green)
  ✅  2. Match   (done, green)
  🔵  3. MC      (current, bold)
  ○   4. FITB    (pending, gray)
  ...
  ──────────────────
  Đã làm: 2/39
```

---

## D12. Player: Màn Hình Kết Quả

```
HEADER: [Logo]  Chủ đề 1 (same as quiz screen)

CONTENT (centered, max-w-lg mx-auto, py-12):

  🎉  (text-6xl, animate-bounce-once)
  Chúc mừng bạn đã đậu!   (text-2xl font-bold)
  hoặc
  Bạn chưa đạt. Cố gắng hơn!  (text-xl text-gray-600)

  Nguyễn Văn An · Lớp 10A1   (text-gray-500)

  ┌────────────────────────────────────────────┐
  │  350 / 390 điểm     89.7%                 │
  │  [████████████████████████████░░░░] 89.7% │  ← h-3 rounded-full
  └────────────────────────────────────────────┘

  [35 Đúng/green]  [3 Sai/red]  [1 Bỏ qua/gray]  ← 3 stat cards

  Thời gian: 35 phút 42 giây

  ─────────────────────────────────────────────
  Trạng thái gửi kết quả:
  ✅ Đã gửi thành công về máy giáo viên
  ─────────────────────────────────────────────

  [Xem lại bài làm]                [Kết thúc]
```

---

## D13. Player: Lockdown Visuals

**Header badge khi Lockdown bật**:
```html
<span class="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded">
  🔒 CHẾ ĐỘ KIỂM TRA
</span>
```

**Dialog khi cố thoát**:
```
Background: dimmed overlay bg-black/20
Dialog: bg-amber-50 border-2 border-amber-300 rounded-xl shadow-xl p-8 text-center

⚠️  (text-4xl)
Không thể thoát
Bài kiểm tra đang diễn ra.
⚠️ Hành động này đã được ghi lại và thông báo cho giáo viên.
Còn lại: 00:23:45  (countdown)

[Tiếp tục làm bài]  (bg-amber-500 text-white h-12 rounded-xl w-full)
```

---

# PHẦN E — TRIỂN KHAI

## E1. Roadmap Thực Tế

### Phase 1: MVP — 12 tuần

**Tuần 1–2**: Scaffold
- Monorepo (pnpm + turbo), shared types (Zod), CI/CD cơ bản
- Tauri 2 setup cả creator + player

**Tuần 3–4**: Welcome Screen + Creator Core
- Welcome Screen (mirror QuizCreator)
- Dashboard 2 tabs skeleton
- Quiz Editor với Ribbon Toolbar
- Question editors: TF, MC, MR, FITB
- Auto-save Ctrl+S

**Tuần 5–6**: Quiz Properties + .qfz + Branding
- 5 tabs Quiz Properties (bao gồm Lockdown toggle)
- Export/Import .qfz
- Branding Settings dialog

**Tuần 7–8**: Player Core + Lockdown
- Player shell app
- Load + decrypt quiz.dat
- Render TF, MC, MR, FITB
- Keyboard navigation
- Lockdown Mode (fullscreen + hotkey hooks)
- Tab-out detection + gửi event TCP

**Tuần 9–10**: Export Player + Giám sát
- 7-Zip SFX bundling
- Export player .exe (+ WebView2 bootstrapper)
- Creator LAN server (port 41235, 41236)
- Dashboard Tab 2: real-time monitor UI
- Result submission: HTTP + LAN + local file

**Tuần 11–12**: Student List + Testing + Polish
- Student List Manager (STT, Tên, Lớp, Điểm)
- Import Excel template
- Test Windows 10 clean machine
- UI polish, fix bugs
- Performance check (RAM targets)

---

### Phase 2: Full Features — 10 tuần

- 6 loại câu hỏi còn lại: Matching, Sequence, Word Bank, Click Map, Short Essay, Blank Page
- Player Template Editor đầy đủ
- Import Quiz từ Word / Excel
- Preview player trong Creator
- Chấm điểm Short Essay thủ công
- Âm thanh cảnh báo khi học sinh tab-out

---

### Phase 3: Production Ready — 6 tuần

- Auto-updater (GitHub Releases)
- Offline WebView2 bundle option (~180MB)
- Code signing certificate
- Result analytics dashboard
- Export kết quả Excel đầy đủ

---

## E2. Rủi Ro & Giải Pháp

| Mức độ | Rủi ro | Giải pháp |
|---|---|---|
| 🔴 Cao | **Antivirus chặn Player.exe** — không có code signing → Windows SmartScreen chặn | Mua code signing cert ~$300/năm TRƯỚC khi ship. Không có cert → học sinh thấy popup đỏ "Windows bảo vệ máy bạn" |
| 🔴 Cao | **WebView2 không có** — máy lab Windows 7/8 hoặc chưa update | Bundle bootstrapper (online mode) hoặc Fixed Runtime (offline mode). Giáo viên chọn khi export |
| 🟡 TB | **NetSupport block mDNS + UDP** | Auto-timeout 5s + 3s → hiện UI nhập IP tay. Giáo viên đọc IP từ monitor screen |
| 🟡 TB | **Short Essay không auto-grade** | Badge "X bài cần chấm thủ công" rõ ràng. Điểm hiện 0 cho đến khi giáo viên chấm |
| 🟡 TB | **Video nặng trong quiz** | Warning khi upload video lớn. Giới hạn 100MB total media mặc định |
| 🟢 Thấp | **SQLite corrupt** | WAL mode + backup tự động khi startup |
| 🟢 Thấp | **Tauri 2 plugin không stable** | Pin exact versions trong Cargo.lock |

---

## E3. UX Edge Cases

### Creator
1. Import .qfz version cũ → migration + thông báo "Đã nâng cấp định dạng"
2. Import .qfz bị corrupt → lỗi rõ ràng, không crash
3. Xóa media đang dùng bởi câu hỏi → block + báo "Đang dùng bởi câu X, Y"
4. Đóng app khi đang export → cancel + cleanup temp files
5. Export quiz 0 câu → validation "Quiz cần ít nhất 1 câu hỏi"
6. Câu hỏi không có correct answer → không cho save
7. "Áp dụng cho tất cả" trong Quiz Properties → confirmation dialog
8. Tên trùng trong danh sách học sinh → cảnh báo, không block, Player hiển thị "(1)" "(2)"
9. Bật Giám sát nhưng không có quiz mở → vẫn nhận được, lưu theo quiz_id trong data
10. Internet chậm → check update timeout 10s, fail silently

### Player
1. Click nộp chưa chọn đáp án → confirm "Bạn chưa chọn. Nộp trống?"
2. Timer hết giờ → auto-submit tất cả câu còn lại (blank answer)
3. Học sinh tắt cửa sổ trước khi gửi xong → "Kết quả chưa gửi. Thoát?"
4. Word Bank: drag từ vào ô đã có → từ cũ về bank, từ mới vào ô
5. Click Map: click ngoài hotspot → không làm gì
6. Mất kết nối khi đang gửi → fallback tự động LAN → local file
7. Ctrl+Alt+Del trong Lockdown → không chặn được, nhưng log tab-out + gửi giáo viên
8. Màn hình < 800px width → scrollable, không bể layout
9. Media bị lỗi → placeholder, không crash
10. Lockdown + máy cúp điện → resume ở câu đang làm khi khởi động lại

---

## E4. Performance Targets

| Metric | Target |
|---|---|
| App startup (Creator) | < 2 giây |
| Question load | < 100ms |
| RAM (Creator) | < 150MB |
| RAM (Player) | < 80MB |
| Player .exe (online mode) | < 30MB |
| Player .exe (offline mode) | < 200MB |
| Quiz file (100 câu, no media) | < 500KB |
| Quiz file (100 câu, with media) | < 50MB |
| Export player .exe | < 30 giây |
| LAN result submission | < 2 giây |

---

## E5. Quyết Định Cần Xác Nhận

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| Q1 | Export mode mặc định: Nhẹ (27MB) hay Offline (180MB)? | Architecture |
| Q2 | Code signing cert: Có mua không ~$300/năm? | UX khi chạy lần đầu |
| Q3 | Update server: GitHub Releases hay self-hosted? | DevOps |
| Q4 | Matching display: Drag&Drop hay Dropdown làm mặc định? | UX |
| Q5 | Mất kết nối hoàn toàn: Lưu file local hay drop result? | Network |
| Q6 | Short Essay: chỉ manual grade hay có keyword auto? | Feature scope |
| Q7 | UI Language: Tiếng Việt only hay thêm English? | i18n scope |
| Q8 | Player retake: 1 lần duy nhất hay cho phép làm lại? | Logic |
| Q9 | Lockdown: bật mặc định hay tắt mặc định khi tạo quiz mới? | UX default |
| Q10 | Tab-out: chỉ log hay kèm âm thanh cảnh báo cho giáo viên? | Monitoring UX |
| Q11 | Branding: cho đổi tên app hay chỉ đổi logo? | Scope |
| Q12 | Welcome screen: tính năng Import từ Word/Excel có ở Phase 1 không? | Roadmap |

---

*QuizForge Master Specification v3.0.0*
*Khi yêu cầu AI Agent implement: tham chiếu mã mục cụ thể.*
*Ví dụ: "Implement D3 Quiz Editor" hoặc "Code B2 Lockdown Mode theo spec này"*
