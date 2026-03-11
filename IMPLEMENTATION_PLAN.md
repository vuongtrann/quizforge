# QuizForge — Implementation Plan
> **Senior Engineer + PO Assessment** — Gap Analysis vs MASTER_SPEC.md v3.0
> Mục tiêu: Thay thế hoàn toàn Wondershare QuizCreator (Flash) với UX tương tự
> Ngày tạo: 2026-03-08 | Ưu tiên: Business-first, ship sớm nhất có thể

---

## EXECUTIVE SUMMARY

**Tình trạng thực tế**: Scaffold + data layer hoàn chỉnh, nhưng **toàn bộ UI tương tác là stub/mock**.
App chưa dùng được cho bất kỳ use case thật nào.

**3 việc block MVP nhất**:
1. Question Editors (10 loại) — không tạo/sửa câu hỏi được
2. Player Renderers (10 loại) — học sinh không làm bài được
3. Result submission pipeline — không gửi/nhận kết quả được

---

## PHASE 1 — CORE FUNCTIONALITY (MVP) 🔴 CRITICAL

### P1.1: Question Editor Dialog Container
**File**: `apps/creator/src/components/QuestionEditorDialog.tsx`
**Tại sao**: Gateway cho tất cả 10 editor — phải làm trước
**Spec**: 900px × max-85vh modal, 2 toolbar rows, Tiptap content area, footer nav

Implement:
```
- Dialog wrapper 900px với shadcn Dialog
- Toolbar Row 1: Font/Size/Bold/Italic/Underline | Score selector | Attempts spinner | Branch selector
- Toolbar Row 2: Insert Image/Sound/Movie/Equation | Spell | Preview
- Tiptap rich text editor (min-height 80px) + media drop zone
- Feedback section: correct text + points / incorrect text + points
- Footer: [← Câu trước] [Câu tiếp →] [+ Câu mới] ... [OK] [Hủy]
- State: accept question|null → emit onSave(question) / onCancel()
- TanStack Form + Zod validation
- Route question type → correct sub-editor component
```

### P1.2: 10 Question Editors (Creator)
**Thư mục**: `apps/creator/src/components/editors/`
**Thứ tự implement** (dễ → khó):

#### P1.2.1 TrueFalseEditor.tsx
- Statement: Tiptap rich text (binding to question.text)
- Đúng/Sai radio (correctAnswer: true/false)
- Optional media upload placeholder
- Zod: TrueFalseQuestionSchema validation

#### P1.2.2 MultipleChoiceEditor.tsx
- 2–10 options: text input + optional media + Delete button + Add option button
- Radio để chọn đáp án đúng (exactly 1)
- Shuffle options toggle
- Feedback per choice OR per question (feedback_mode selector)
- Add/remove option (min 2, max 10)
- Zod validation: must have exactly 1 correct

#### P1.2.3 MultipleResponseEditor.tsx
- Giống MC nhưng Checkbox thay Radio
- Multiple correct answers (min 1)
- Partial scoring toggle + hiển thị công thức:
  `Điểm = max(0, (đúng_chọn - sai_chọn) / tổng_đúng × điểm_tối_đa)`

#### P1.2.4 ShortEssayEditor.tsx (đơn giản hơn FITB)
- Question text (Tiptap)
- Reference answer textarea (cho giáo viên tham khảo)
- Max words input (optional)
- Keywords input (comma-separated)
- Default 0 points + note "Chấm thủ công"

#### P1.2.5 BlankPageEditor.tsx
- Title input
- Rich text content (Tiptap)
- Show timer toggle
- Không có scoring

#### P1.2.6 FillInBlankEditor.tsx ⚠️ Phức tạp
- Tiptap với custom `[BLANK_1]` insertion button
- Dưới editor: danh sách blanks detected từ template
- Mỗi blank: list acceptable answers (multiline input) + caseSensitive + trimWhitespace toggle
- Preview showing template with blank markers highlighted
- Validation: template phải có ≥1 blank

#### P1.2.7 MatchingEditor.tsx
- 2–10 pairs: Choice column | Match column
- Both text inputs (media placeholder for later)
- Add/Remove pair buttons
- Display mode: Drag&Drop / Dropdown radio
- Shuffle both columns toggles
- Validation: min 2 pairs

#### P1.2.8 SequenceEditor.tsx
- Items list với drag-to-reorder (dnd-kit)
- Creator nhập đúng thứ tự (thứ tự nhập = đáp án đúng)
- 2–10 items
- Add/Remove item buttons
- Horizontal layout toggle

#### P1.2.9 WordBankEditor.tsx
- Template text area (text with [SLOT_1], [SLOT_2] markers)
- Word pool: list of words với isDistractor toggle
- Add distractor words
- Preview: render template with blank slots + word bank below
- Shuffle words toggle

#### P1.2.10 ClickMapEditor.tsx ⚠️ Phức tạp nhất
- Image upload (base64 → stored in question.media)
- Canvas overlay: drag to draw Rect hotspots
- Click on drawn hotspot: mark isCorrect toggle
- List hotspots panel: shape, coords, isCorrect, delete
- Click limit input
- Validation: phải có image + ≥1 hotspot

### P1.3: 10 Question Renderers (Player)
**Thư mục**: `apps/player/src/renderers/`
**Liên kết với**: Validation logic đã có trong `validate.rs`

#### P1.3.1 TrueFalsePlayer.tsx
- 2 large buttons: "✓ ĐÚNG" (green) / "✗ SAI" (red), height 64px
- Selected state: filled background
- Keyboard: 1=Đúng, 2=Sai
- After submit: show correct answer with color

#### P1.3.2 MultipleChoicePlayer.tsx
- Radio options với A/B/C/D prefix labels
- Hover: border-brand-400, bg-brand-50
- Selected: border-brand-500, bg-brand-100
- After submit: correct=green, wrong selected=red
- Keyboard: 1/2/3/4... select option

#### P1.3.3 MultipleResponsePlayer.tsx
- Checkbox options
- Multiple selection
- After submit: correct unchecked=green outline, wrong checked=red
- "Chọn tất cả đúng" hint text

#### P1.3.4 FillInBlankPlayer.tsx
- Render template text với inline `<input>` tại vị trí blank
- Tab navigation giữa các blank
- Input widths proportional to longest answer
- After submit: correct=green border, wrong=red border + show correct answer

#### P1.3.5 MatchingPlayer.tsx (Drag & Drop mode)
- Left column: shuffled choices
- Right column: shuffled matches (drop zones)
- Drag choice → drop vào match slot
- Visual: dragging item has opacity 0.5, drop zone highlights
- Also support Dropdown mode (select element)

#### P1.3.6 SequencePlayer.tsx
- Items displayed in shuffled order
- Drag to reorder (dnd-kit vertical sortable)
- Visual position numbers update on drag
- After submit: show correct order với color coding

#### P1.3.7 WordBankPlayer.tsx
- Template rendered với blank slots (dashed border boxes)
- Word bank below: clickable word chips
- Click word → places in first empty slot
- Click word in slot → returns to bank
- Shuffle words
- After submit: correct=green, wrong=red + show correct

#### P1.3.8 ShortEssayPlayer.tsx
- Textarea với word count display
- Max words counter (if set)
- No auto-scoring (submit returns 0 points)
- "Bài này do giáo viên chấm" notice

#### P1.3.9 ClickMapPlayer.tsx
- Display image with hotspot overlay (pointer-events)
- Click on image → detect hotspot collision
- Visual: clicked hotspot highlighted
- Click limit indicator
- After submit: correct hotspots=green, wrong=red

#### P1.3.10 BlankPagePlayer.tsx
- Render rich text HTML content
- Show timer still counting
- "Nhấn tiếp theo để tiếp tục" button
- No answer needed

### P1.4: Connect Player App.tsx to Real Data
**File**: `apps/player/src/App.tsx`
```
- Gọi invoke('load_quiz_data') trên mount
- Gọi invoke('get_students') sau khi load quiz
- Update playerStore với data thật
- Remove tất cả mock/hardcoded data
```

### P1.5: Fix ResultScreen.tsx
**File**: `apps/player/src/components/ResultScreen.tsx`
```
- Đọc từ playerStore.questionResults (thật)
- Tính tổng điểm từ questionResults
- Tính passed/failed từ quiz.settings.passingRate
- Time spent = Date.now() - playerStore.startTime
- Submit kết quả: gọi invoke flow (HTTP → LAN → local file)
- Hiển thị submission status
```

---

## PHASE 2 — CREATOR DIALOGS 🟠 HIGH

### P2.1: QuizPropertiesDialog.tsx
5 tabs theo MASTER_SPEC D5:

**Tab 1: Thông tin Quiz**
- TanStack Form fields: title, author, description (Tiptap)
- Checkbox: hiển thị trang giới thiệu, thu thập thông tin học sinh
- Show statistics toggle

**Tab 2: Cài đặt Quiz**
- Passing rate: number input (%) + range slider
- Time limit: toggle + number input (giây) + warning % input
- Randomization: toggle questions + count + toggle options
- Submission mode: per_question / all_at_once radio
- Allow review toggle, one attempt toggle
- **Lockdown Mode section**:
  - Toggle bật/tắt
  - Exit condition: hết thời gian / nộp bài / cả hai radio

**Tab 3: Kết quả**
- Feedback mode: by_result / always radio
- Pass message (Tiptap), Fail message (Tiptap)
- Show statistics toggle
- Finish button: show toggle, pass URL, fail URL

**Tab 4: Cài đặt Câu hỏi (Defaults)**
- Default points correct/incorrect
- Default feedback text (correct/incorrect)
- Shuffle toggles
- "Áp dụng cho tất cả" button → confirmation dialog

**Tab 5: Bảo mật**
- Password protection: none / password / user_id_password radio
- Password input (conditional)
- User table (TanStack Table) cho user_id_password mode
- Domain restriction toggle + input

### P2.2: ThemeEditorDialog.tsx
Split-panel 1100px:

**Left panel (300px)**:
- Primary color picker (hex input + color picker)
- Background color picker
- Text color picker
- Font selector (Be Vietnam Pro, Arial, Times, etc.)
- Font size slider (12–20px)
- Progress style radio: Bar / Dots / Number
- Navigation style radio: Buttons / Sidebar / Floating
- Rounded corners toggle
- Show timer toggle

**Right panel (800px)**:
- Live preview của Player interface
- Update real-time khi thay đổi settings
- Preset theme buttons (5–6 preset colors)

### P2.3: StudentListDialog.tsx
- Download Excel template button
- Import Excel (drag/drop hoặc click) → parse via xlsx library
- Dropdown: chọn/tạo list + rename
- Checkbox: gắn với quiz hiện tại
- TanStack Table: STT, Họ tên, Lớp, Mã HS, Email
  - Validation: Tên bắt buộc, highlight lỗi inline
  - Duplicate name: warning badge "(2)" nhưng không block
- Footer: tổng count, error count, buttons
- Save: gọi Tauri command create_student_list

### P2.4: ExportDialog.tsx
- Quiz info card
- Export mode radio: Nhẹ (~27MB) / Offline (~180MB)
- Result server URL input
- Student list: toggle + dropdown selector
- Output filename input (auto: QuizName_Player.exe)
- Browse output directory button
- Collapsible advanced section
- Export button → Progress dialog:
  - Animated progress bar
  - Step indicators: Kiểm tra → Mã hóa → Đóng gói → Tạo file

### P2.5: BrandingDialog.tsx
- Logo upload (square + rectangle variants)
- Footer text input
- Custom domain toggle + input
- Remove branding toggle
- Welcome background: solid / gradient / image radio + color picker
- Organization name + website inputs
- Live mini-preview (400×180px)

---

## PHASE 3 — BACKEND COMPLETION 🟡 MEDIUM

### P3.1: Fix .qfz Export/Import (Rust)
**File**: `apps/creator/src-tauri/src/commands/export_commands.rs`

**export_quiz_to_qfz cần thêm**:
- Đọc questions từ DB và write vào `questions.json`
- Read student list nếu có → `students.json`
- Read theme → `theme.json`
- Đọc media files → copy vào `media/` folder trong ZIP
- Update manifest với questionCount, mediaCount

**import_quiz_from_qfz cần hoàn thiện**:
- Đọc `questions.json` → insert vào questions table
- Đọc `students.json` → create student_list
- Đọc `theme.json` → update quiz theme
- Đọc `media/` → copy files ra disk, insert media_files records
- Version check + migration nếu cần

### P3.2: Student Commands (Rust)
**File**: `apps/creator/src-tauri/src/commands/student_commands.rs`

Implement thật:
- `get_student_lists()`: SELECT từ student_lists + students count
- `create_student_list(name, students, quiz_id)`: INSERT list + INSERT students
- `delete_student_list(id)`: DELETE (cascade tới students)
- `get_students_by_list(list_id)`: SELECT students WHERE list_id
- `bind_student_list_to_quiz(quiz_id, list_id)`: INSERT quiz_student_lists

### P3.3: LAN Receiver Server (Rust)
**File**: `apps/creator/src-tauri/src/network/server.rs`

```rust
// Axum HTTP server
// POST /result → validate + save to quiz_results + emit tauri event
// GET /health → { status: "ok", quiz_id }
// mDNS advertisement: _quizforge._tcp.local
// Tauri event: emit("result-received", MonitorStudent)
```

### P3.4: Dashboard Monitor Real-time
**File**: `apps/creator/src/pages/Dashboard.tsx`

- Tauri `listen("result-received", ...)` hook
- Update monitor state khi nhận event
- Tauri `listen("heartbeat", ...)` mỗi 10s per student
- Tính "Mất kết nối" khi không heartbeat >30s

### P3.5: Player Result Submission
**File**: `apps/player/src-tauri/src/commands/network.rs`

3-tier fallback:
1. HTTP POST đến result_server_url (retry 3x: 0s, 3s, 10s)
2. LAN: mDNS discover → TCP connect port 41235 → send JSON → await ACK
3. Local: save `result_<name>_<timestamp>.json` to Desktop

Heartbeat sender: mỗi 10s gửi HeartbeatSchema JSON

### P3.6: Fix Question CRUD (Rust)
**File**: `apps/creator/src-tauri/src/commands/question_commands.rs`

- `reorder_questions`: UPDATE order_index theo Vec<(id, new_index)>
- `duplicate_question`: Clone row với new UUID

### P3.7: Settings Save/Load
**File**: `apps/creator/src/pages/Settings.tsx`

- Load: gọi Tauri `get_app_settings` (cần thêm command)
- Save: gọi Tauri `update_app_setting(key, value)` cho từng field

---

## PHASE 4 — PLAYER HARDENING 🟡 MEDIUM

### P4.1: Fix playerStore Types
**File**: `apps/player/src/store/playerStore.ts`

- Replace tất cả `any` bằng đúng types từ `@quizforge/types`
- `quiz: Quiz | null`
- `students: Student[]`
- `answers: Map<string, unknown>` (type varies per question type)
- `questionResults: Map<string, ValidationResult>`

### P4.2: Keyboard Navigation
**File**: `apps/player/src/hooks/useKeyboardNavigation.ts`

```typescript
// ArrowRight/PageDown → nextQuestion
// ArrowLeft/PageUp → prevQuestion
// Space/Enter → submitAnswer (khi MC/TF đã chọn)
// 1-9 → select option (MC/MR/TF)
// Escape → toggleOutline
// Ctrl+Enter → submitAll
// Prevent: F5, F12, Ctrl+U, Ctrl+Shift+I
```

### P4.3: Security Hardening (Player)
**File**: `apps/player/src-tauri/src/security/mutex.rs`

- Named Mutex với quiz_id để prevent double-open
- Format: `"Global\QuizForge_Player_<quiz_id>"`

### P4.4: Lockdown Mode
**File**: `apps/player/src-tauri/src/lib.rs`

Khi quiz.settings.lockdownMode = true:
- `window.set_fullscreen(true)`
- `window.set_always_on_top(true)`
- Override close event handler
- Tab-out: SetWinEventHook → log + send heartbeat ngay

---

## PHASE 5 — POLISH & EDGE CASES 🟢 NICE TO HAVE

### P5.1: UX Edge Cases (theo MASTER_SPEC E3)
**Creator**:
- Export 0-question quiz → block với toast "Cần ít nhất 1 câu hỏi"
- Question chưa có đáp án đúng → block save + highlight field
- Delete media đang dùng → block + "Đang dùng bởi câu X"
- Close khi đang export → cancel + cleanup temp dir
- Import .qfz cũ → migration + toast thông báo

**Player**:
- Submit khi chưa chọn → confirm dialog "Bạn chưa chọn. Nộp trống?"
- Timer hết → auto-submit tất cả câu còn lại (blank)
- Close trước khi submit → "Kết quả chưa gửi. Thoát?"
- Word Bank: kéo vào ô đã có → swap
- Click Map: click ngoài hotspot → ignore, không log

### P5.2: Toast Notification System
Implement Toast provider:
- 4 types: success / error / warning / info
- Auto-dismiss 4s
- Stack max 5
- Position: bottom-right
- Slide-in animation

### P5.3: Auto-Update
**File**: `apps/creator/src-tauri/src/lib.rs`
- Background check on startup (async)
- Toast: "Có phiên bản mới X.Y.Z" với 3 buttons
- Background download → restart prompt

### P5.4: Drag & Drop Question Reorder (Creator)
**File**: `apps/creator/src/pages/QuizEditor.tsx`
- @dnd-kit/sortable trên QuestionList
- Sau drop: gọi `reorder_questions` Tauri command

### P5.5: Media Upload
**File**: `apps/creator/src-tauri/src/commands/` (cần tạo `media_commands.rs`)
- upload_media: file → WebP 85% quality (image crate) → save → insert media_files
- delete_media: check references → delete file → DELETE row
- get_media_data: SELECT → read file → base64

### P5.6: Tests
```
packages/types: Zod schema validation tests
packages/quiz-engine: scoring tests cho tất cả 10 loại
```

---

## TRACKING CHECKLIST

### Phase 1 (MVP) — ~3–4 sessions
- [ ] P1.1 QuestionEditorDialog container
- [ ] P1.2.1 TrueFalseEditor
- [ ] P1.2.2 MultipleChoiceEditor
- [ ] P1.2.3 MultipleResponseEditor
- [ ] P1.2.4 ShortEssayEditor
- [ ] P1.2.5 BlankPageEditor
- [ ] P1.2.6 FillInBlankEditor
- [ ] P1.2.7 MatchingEditor
- [ ] P1.2.8 SequenceEditor
- [ ] P1.2.9 WordBankEditor
- [ ] P1.2.10 ClickMapEditor
- [ ] P1.3.1 TrueFalsePlayer
- [ ] P1.3.2 MultipleChoicePlayer
- [ ] P1.3.3 MultipleResponsePlayer
- [ ] P1.3.4 FillInBlankPlayer
- [ ] P1.3.5 MatchingPlayer
- [ ] P1.3.6 SequencePlayer
- [ ] P1.3.7 WordBankPlayer
- [ ] P1.3.8 ShortEssayPlayer
- [ ] P1.3.9 ClickMapPlayer
- [ ] P1.3.10 BlankPagePlayer
- [ ] P1.4 Connect Player App.tsx to real data
- [ ] P1.5 Fix ResultScreen.tsx

### Phase 2 (Creator Dialogs) — ~2 sessions
- [ ] P2.1 QuizPropertiesDialog (5 tabs)
- [ ] P2.2 ThemeEditorDialog
- [ ] P2.3 StudentListDialog
- [ ] P2.4 ExportDialog
- [ ] P2.5 BrandingDialog

### Phase 3 (Backend) — ~2 sessions
- [ ] P3.1 .qfz Export/Import complete
- [ ] P3.2 Student commands (Rust)
- [ ] P3.3 LAN Receiver server
- [ ] P3.4 Dashboard monitor real-time
- [ ] P3.5 Player result submission 3-tier
- [ ] P3.6 Question CRUD fixes
- [ ] P3.7 Settings save/load

### Phase 4 (Player Hardening) — ~1 session
- [ ] P4.1 playerStore types fix
- [ ] P4.2 Keyboard navigation
- [ ] P4.3 Mutex security
- [ ] P4.4 Lockdown mode

### Phase 5 (Polish) — ~2 sessions
- [ ] P5.1 UX edge cases
- [ ] P5.2 Toast system
- [ ] P5.3 Auto-update
- [ ] P5.4 DnD reorder
- [ ] P5.5 Media upload
- [ ] P5.6 Tests

---

## QUYẾT ĐỊNH THIẾT KẾ

### Đã quyết định (theo MASTER_SPEC)
- Tiptap cho rich text (đã cài trong creator)
- AES-256-GCM + PBKDF2-SHA256 cho encryption
- mDNS + TCP cho LAN communication
- SQLite với JSON columns cho flexible data
- pnpm workspaces + Turborepo

### Cần quyết định
1. **FillInBlank blank detection**: Dùng `[BLANK]` marker hay Tiptap custom node?
   - Đề xuất: Tiptap custom inline node `<blank-node>` vì đẹp hơn, hỗ trợ rich text xung quanh blank
   - Alternative: Simple `[BLANK_1]` text marker + regex parsing (đơn giản hơn, ít lỗi hơn)

2. **ClickMap hotspot drawing**: Canvas 2D API hay SVG overlay?
   - Đề xuất: SVG (responsive, dễ click detection, dễ serialize coordinates)

3. **Player bundle packaging**: Hiện tại chỉ tạo `quiz.dat` + `students.dat`, chưa bundle exe
   - Block: Cần giải pháp đóng gói (7z SFX hoặc NSIS) — phức tạp, defer sang Phase 5

4. **Word import**: Spec đề cập import từ Word/Excel
   - Đề xuất: Sử dụng `docx` crate cho Word, `calamine` cho Excel trong Rust backend
   - Priority: Low — defer sau khi 10 question types hoạt động

---

## NGUYÊN TẮC CODE

Theo AGENT_SPEC_V2.md:
1. Không dùng `any` TypeScript — dùng `unknown` + Zod parse
2. Mọi form: TanStack Form + Zod
3. Mọi async data: TanStack Query
4. Mọi navigation: TanStack Router
5. Loading/error/empty state BẮT BUỘC trên mọi component
6. Rust errors: `thiserror` + `serde`
7. Vietnamese text cho tất cả UI strings
8. Co-locate tests với implementation files
