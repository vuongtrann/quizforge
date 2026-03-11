# QuizForge — Báo Cáo Trạng Thái Dự Án
> Tạo lúc: 2026-03-09 | Nguồn: Quét trực tiếp source code

---

## TÓM TẮT THỰC THI (Executive Summary)

| Hạng mục | Tiến độ thực tế | Ghi chú |
|---|---|---|
| Scaffold / Monorepo | ✅ 100% | Xong hoàn toàn |
| Shared Types (Zod) | ✅ 95% | Đầy đủ, cần test |
| Quiz Engine (scoring) | ✅ 90% | Cần test unit |
| Creator — Question Editors (10 loại) | ✅ 100% | Tất cả đã implement thật |
| Creator — Dialogs chính | ✅ 100% | 4/4 dialog đã implement thật |
| Creator — Backend Rust (CRUD) | ⚠️ 70% | student_commands còn thiếu |
| Creator — Export (.qfz) | ⚠️ 60% | Thiếu questions.json, media/, students.json |
| Creator — Export (Player bundle) | ⚠️ 70% | quiz.dat OK, bundle EXE chưa làm |
| Player — Renderers (10 loại) | ✅ 100% | Tất cả đã implement thật |
| Player — Data Pipeline | ❌ 10% | App.tsx vẫn dùng mock data hardcode |
| Player — Validation (Rust) | ⚠️ 70% | Logic OK, partial scoring stub |
| LAN Networking | ⚠️ 40% | Server nhận được nhưng không lưu DB |
| Security / Anti-cheat | ❌ 0% | Chưa làm |
| Auto-updater | ❌ 0% | Chưa làm |
| Tests (Vitest/Playwright) | ❌ 0% | Chưa làm |
| CI/CD (GitHub Actions) | ❌ 0% | Chưa làm |

---

## PHẦN ĐÃ HOÀN THÀNH ✅

### Creator App — Question Editors (10/10 ✅)
Tất cả đã implement thật, có UI đầy đủ, Vietnamese labels:

| Editor | Trạng thái | Chi tiết |
|---|---|---|
| TrueFalseEditor.tsx | ✅ | Radio button UI, visual feedback |
| MultipleChoiceEditor.tsx | ✅ | Add/remove options, A-B-C label, toggle correct |
| MultipleResponseEditor.tsx | ✅ | Checkbox multi-select, partial scoring toggle |
| FillInBlankEditor.tsx | ✅ | Template text + blank manager, case sensitivity |
| MatchingEditor.tsx | ✅ | Pair columns, shuffle toggles, add/remove |
| SequenceEditor.tsx | ✅ | Up/down move buttons, reorder logic |
| WordBankEditor.tsx | ✅ | Distractor toggle, slot assignment |
| ClickMapEditor.tsx | ✅ | Image upload, hotspot overlay, shape selection |
| ShortEssayEditor.tsx | ✅ | Keyword matching, word limit, reference answer |
| BlankPageEditor.tsx | ✅ | Title + content, timer display toggle |

### Creator App — Dialogs (4/4 ✅)

| Dialog | Trạng thái | Chi tiết |
|---|---|---|
| QuestionEditorDialog.tsx | ✅ ~431 lines | Toolbar, switch 10 editors, feedback, validation, prev/next |
| QuizPropertiesDialog.tsx | ✅ ~465 lines | 5 tabs: info/settings/result/questions/security |
| StudentListDialog.tsx | ✅ ~234 lines | Excel import/export, add/remove, search |
| ExportDialog.tsx | ✅ ~200 lines | Web/EXE/SCORM selection, progress bar, Tauri invoke |

### Player App — Renderers (10/10 ✅)
Tất cả đã implement thật (xác nhận qua đọc file trực tiếp):

| Renderer | Trạng thái | Chi tiết |
|---|---|---|
| TrueFalsePlayer.tsx | ✅ | 2 button lớn True/False, feedback coloring |
| MultipleChoicePlayer.tsx | ✅ | A-B-C labeling, feedback style green/red |
| MultipleResponsePlayer.tsx | ✅ | Checkbox toggle, multi-select |
| FillInBlankPlayer.tsx | ✅ | Template parsing `{{uuid}}`, inline inputs |
| MatchingPlayer.tsx | ✅ | Left/right column, selection + unmatch logic |
| SequencePlayer.tsx | ✅ | @dnd-kit drag/drop với GripVertical handle |
| WordBankPlayer.tsx | ✅ | Click-to-select word → fill slot, swap logic |
| ClickMapPlayer.tsx | ✅ | Image click handler, percentage coords, ping animation |
| ShortEssayPlayer.tsx | ✅ | Textarea with char count |
| BlankPagePlayer.tsx | ✅ | Static content/info display |

### Packages
- `@quizforge/types` — ✅ 95% — Đầy đủ Zod schemas 10 question types
- `@quizforge/quiz-engine` — ✅ 90% — scoring.ts + validation.ts
- `@quizforge/ui` — ✅ 100% — cn() utility

---

## PHẦN CHƯA LÀM / CÒN LỖI ❌⚠️

### 🔴 CRITICAL — Blockers cho MVP

#### 1. Player App.tsx — Vẫn dùng Mock Data
**File**: `apps/player/src/App.tsx`
**Vấn đề**: `useEffect` load 20 câu hỏi mock hardcode thay vì gọi Tauri để đọc `quiz.dat` thật.
**Cần làm**:
- Gọi `invoke('load_quiz_bundle')` → nhận `QuizDisplayData`
- Gọi `invoke('load_students')` → nhận `Student[]`
- Parse + validate qua Zod schema
- Xử lý error (file không tìm thấy, corrupt, v.v.)

#### 2. playerStore.ts — Kiểu `any` vi phạm spec
**File**: `apps/player/src/store/playerStore.ts`
**Vấn đề**: `quiz: any | null`, `students: any[]`, `selectedStudent: any` — vi phạm rule #3 của AGENT_SPEC.
**Cần làm**: Import và dùng `QuizDisplayData`, `Student` types từ `@quizforge/types`.
*Lưu ý*: `submitAnswer()` đã gọi Tauri invoke thật — cái này OK.

#### 3. LAN Server không lưu kết quả vào DB
**File**: `apps/creator/src-tauri/src/network/server.rs`
**Vấn đề**: Handler `/submit` nhận JSON nhưng chỉ in ra console + emit event, không `INSERT` vào bảng `quiz_results`.
**Cần làm**: Gọi `db.insert_quiz_result(result)` trong `handle_submission()`.

---

### 🟠 HIGH — Tính năng quan trọng còn thiếu

#### 4. .qfz Export thiếu nhiều file
**File**: `apps/creator/src-tauri/src/commands/export_commands.rs`
**Vấn đề**: Export ZIP thiếu:
- `questions.json` — **CHƯA CÓ** (nghiêm trọng)
- `students.json` — **CHƯA CÓ**
- `theme.json` — **CHƯA CÓ**
- `media/` folder — **CHƯA CÓ**

#### 5. Student Commands (Rust) còn stub
**File**: `apps/creator/src-tauri/src/commands/student_commands.rs`
**Vấn đề**: Hầu hết functions là placeholder, chưa query DB thật.

#### 6. ResultScreen dùng mock data
**File**: `apps/player/src/components/ResultScreen.tsx`
**Vấn đề**: Hardcode "85%" thay vì tính từ `questionResults` trong store.

---

### 🟡 MEDIUM — Tính năng cần hoàn thiện

#### 7. Partial Scoring trong validate.rs
**File**: `apps/player/src-tauri/src/commands/validate.rs`
**Vấn đề**: Partial scoring cho `multiple_response` chưa implement.

#### 8. Player Bundle — Bundle EXE chưa làm
**File**: `apps/creator/src-tauri/src/commands/export_commands.rs`
**Vấn đề**: Chỉ tạo `quiz.dat` + `students.dat`, chưa đóng gói thành `.exe` standalone.

#### 9. Heartbeat Player → Creator
Chưa implement: Player không gửi heartbeat định kỳ về Creator (để detect tab-out, crash).

#### 10. Monitor tab dùng mock data
**File**: `apps/creator/src/pages/Dashboard.tsx`
Vẫn hiển thị mock results thay vì dữ liệu thật từ `quiz_results` table.

---

### 🔵 LOW — Nice-to-have / Future

#### 11. Auto-updater (STEP_20) — 0%
- `tauri-plugin-updater` chưa setup
- Background check, toast notification chưa có
- ed25519 signature verification chưa có

#### 12. Security Hardening (STEP_21) — 0%
- Named Mutex chưa implement
- Lockdown mode (fullscreen, always-on-top) chưa thật
- System hotkey hooks (Alt+Tab, Win, Ctrl+Esc) chưa có
- Tab-out detection `SetWinEventHook` chưa có

#### 13. Tests (STEP_22) — 0%
- Không có unit tests cho Zod schemas
- Không có unit tests cho quiz-engine scoring
- Không có integration tests
- Không có E2E tests (Playwright)

#### 14. CI/CD (STEP_23) — 0%
- Chưa có GitHub Actions workflows
- Chưa có release pipeline

#### 15. UX Edge Cases — Phần lớn chưa làm
- Import .qfz cũ → migration
- Export 0-question quiz → block
- Timer expire → auto-submit
- Network loss → fallback local file

---

## TASK LIST THEO ƯU TIÊN

### Sprint 1 — Làm ngay (MVP blockers)

```
[ ] P0-1: Fix Player App.tsx — kết nối Tauri load_quiz_bundle thật
[ ] P0-2: Fix playerStore.ts — thay any bằng QuizDisplayData types
[ ] P0-3: Fix ResultScreen.tsx — tính điểm từ questionResults trong store
[ ] P0-4: Fix LAN server.rs — INSERT quiz_results vào SQLite sau khi nhận
[ ] P0-5: Fix .qfz export — thêm questions.json, students.json, theme.json, media/
```

### Sprint 2 — Hoàn thiện tính năng

```
[ ] P1-1: Student commands (Rust) — implement đủ CRUD thật
[ ] P1-2: Partial scoring trong validate.rs (multiple_response, fill_in_blank)
[ ] P1-3: Monitor tab — kết nối events thật từ LAN server
[ ] P1-4: Settings page — save/load từ Tauri backend thật
[ ] P1-5: Lockdown mode — implement fullscreen + always-on-top
```

### Sprint 3 — Production ready

```
[ ] P2-1: Player bundle EXE packaging (7-Zip SFX hoặc NSIS)
[ ] P2-2: Named Mutex (ngăn mở nhiều lần)
[ ] P2-3: System hotkey blocking (lockdown mode)
[ ] P2-4: Tab-out detection + logging
[ ] P2-5: Auto-updater với ed25519 verification
[ ] P2-6: Unit tests (Vitest) cho types + quiz-engine
[ ] P2-7: Integration tests
[ ] P2-8: CI/CD GitHub Actions
```

---

## GHI CHÚ KỸ THUẬT QUAN TRỌNG

### Vấn đề task.md vs thực tế
File `task.md` đánh dấu tất cả question editors + renderers là "DONE" — **đúng theo thực tế**.
File `WORK_LOG.md` nói "STUB" — **sai**, đây là thông tin cũ từ SESSION 001 trước khi code được viết.
**Kết luận**: Creator editors + Player renderers ĐÃ HOÀN THÀNH. Điểm nghẽn chính là data pipeline của Player.

### Điểm nghẽn số 1 cho demo
Player app load mock data → học sinh chỉ thấy quiz giả. Để demo được với quiz thật cần:
1. Fix `App.tsx` gọi `invoke('load_quiz_bundle')`
2. Fix `playerStore` types
3. Fix `ResultScreen` tính điểm thật

### Điểm nghẽn số 2 cho LAN exam
Creator nhận kết quả từ Player nhưng không lưu vào DB → Monitor tab không hiển thị gì. Cần fix `server.rs`.

---

*Báo cáo được tạo tự động bằng cách đọc trực tiếp source code — không dựa vào comments hay TODO.*
