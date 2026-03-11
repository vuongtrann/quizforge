# FINISHPLAN.md — Kế hoạch hoàn thiện QuizForge (Bản kỹ thuật cho AI Agent)

> Ngày tạo: 2026-03-10 | Cập nhật: 2026-03-10 (hợp nhất Batch 1+2, đã audit codebase)
> Nguồn: 40 ảnh chụp Wondershare QuizCreator + 2 file template Office + audit toàn bộ codebase
> Mục tiêu: QuizForge bằng hoặc hơn QuizCreator về tính năng, 0 lỗi, sẵn sàng triển khai

---

## THỰC TRẠNG SAU AUDIT (Đã kiểm chứng từng file)

### ĐÃ HOÀN THÀNH — Không cần làm lại:
- ✅ 10 loại câu hỏi (editor + renderer) — `packages/types/src/quiz.ts:56-255`
- ✅ Giao diện Ribbon giống Office
- ✅ Drag-drop sắp xếp câu hỏi
- ✅ Export .qfz + Player bundle AES-256-GCM
- ✅ LAN monitoring real-time — `Dashboard.tsx:175-364`
- ✅ Student list management
- ✅ Keyboard navigation Player
- ✅ Anti-cheat lockdown
- ✅ **Timer auto-submit** — `playerStore.ts:160-162` gọi `finishQuiz()` khi `timeRemaining <= 1`
- ✅ **Status bar thống kê** — `QuizEditor.tsx:599-608` hiện tên bài, số câu, tỷ lệ đạt, tổng điểm
- ✅ **Media toolbar trong editor** — `QuestionEditorDialog.tsx:501-509` có 3 nút (Image/Music/Video), wired upload
- ✅ **Question Outline** — `QuizPlayer.tsx:271-302` panel số câu, click nhảy, màu trạng thái
- ✅ **ThemeEditorDialog** — 291 dòng, 2 tab (Template + Layout), live preview, color picker
- ✅ **Import Excel (Rust)** — `import_commands.rs` có `generate_import_template()` + `parse_import_from_excel()`
- ✅ **WelcomeScreen** — có nút Import từ Word/Excel (cả 2 trỏ ImportExcelDialog)
- ✅ **appStore.hasUnsavedChanges** — flag đã khai báo (`appStore.ts:23-24`), chưa wire UI
- ✅ 0 lỗi TypeScript, 0 lỗi Rust, 76 unit tests pass

### SCHEMA THỰC TẾ (field paths chính xác):
```
quiz.settings.randomization.randomizeQuestions  // boolean — shuffle questions
quiz.settings.randomization.randomizeOptions    // boolean — shuffle answers
quiz.settings.randomization.randomCount         // number? — random N from pool
quiz.settings.submission.mode                   // 'per_question' | 'all_at_once'
quiz.settings.submission.showCorrectAfterSubmit // boolean
quiz.settings.submission.allowReview            // boolean
quiz.settings.submission.oneAttemptOnly          // boolean (NOT maxAttempts number)
quiz.settings.submission.promptResume            // boolean
quiz.settings.timeLimit.enabled                  // boolean
quiz.settings.timeLimit.durationSeconds          // number
quiz.settings.lockdown.enabled                   // boolean
quiz.information.collectParticipantData.enabled  // boolean
quiz.information.collectParticipantData.fields   // ('name'|'email'|'student_id'|'class')[]
quiz.theme.primaryColor                          // string (hex)
quiz.theme.fontFamily                            // string
quiz.theme.progressStyle                         // 'bar'|'dots'|'number'
quiz.theme.navigationStyle                       // 'buttons'|'sidebar'|'floating'
quiz.resultSettings.passMessage                  // string
quiz.resultSettings.failMessage                  // string
quiz.resultSettings.finishButton.passUrl         // string?
quiz.resultSettings.finishButton.failUrl         // string?
question.media                                   // Media object (NOT mediaId)
question.group                                   // string? (NOT questionGroup)
```

---

## GAP ANALYSIS — Chỉ những gì THỰC SỰ THIẾU

| # | Tính năng | Trạng thái thực | Ưu tiên |
|---|-----------|-----------------|---------|
| G1 | Player: Shuffle câu hỏi + đáp án | Schema có, Player KHÔNG shuffle | P0 |
| G2 | Player: Chế độ nộp cả bài (all_at_once) | Schema có `submission.mode`, Player luôn per_question | P0 |
| G3 | Player: Render media (ảnh/âm thanh) trong câu hỏi | `question.media` có data, KHÔNG renderer nào hiển thị | P0 |
| G4 | Player: Áp dụng Theme/CSS variables | ThemeEditorDialog hoàn chỉnh, Player BỎ QUA hoàn toàn | P0 |
| G5 | Creator: Nhóm câu hỏi CRUD + tree view | DB có `question.group`, tree CHỈ hiện loại câu hỏi | P0 |
| G6 | Player: Xem lại bài làm (Result Review) | Nút "Xem lại" có, KHÔNG có onClick handler | P1 |
| G7 | Player: Random N câu từ ngân hàng | Schema có `randomCount`, Player KHÔNG implement | P1 |
| G8 | Quiz Properties: Tab "Cài đặt Câu hỏi" | Tab 4 ghi "Not yet implemented" | P1 |
| G9 | Player: Thu thập thông tin thí sinh (form) | Schema có `collectParticipantData`, Player chỉ có student picker | P1 |
| G10 | Publish Dialog: tóm tắt quiz + dropdown format | Không có header tóm tắt, SCORM/LMS chưa implement | P1 |
| G11 | Player: Màn hình mật khẩu + thông tin bài thi | Player nhảy thẳng vào student selector, không có password/info | P1 |
| G12 | Result fallback: lưu .qfr khi mất LAN | Không có file fallback | P1 |
| G13 | Import từ Word: template + parser | Nút WelcomeScreen có nhưng trỏ sai sang Excel dialog | P1 |
| G14 | Outline: indicators dạng chấm + validation alert | Outline grid có, THIẾU dot indicators + alert popup | P1 |
| G15 | Modified indicator: wire hasUnsavedChanges lên UI | Flag có trong appStore, KHÔNG hiện trên UI | P2 |
| G16 | Rich text pass/fail messages | Plain textarea, chưa có TipTap editor | P2 |
| G17 | Font customization question/answer | Không có | P2 |
| G18 | Tab "Khác": email notification + page meta | Không có | P2 |
| G19 | Per-question time limit | KHÔNG có trong schema, chỉ có quiz-level timer | P2 |
| G20 | Attempt limit + Resume quiz | Schema có `oneAttemptOnly` + `promptResume`, Player KHÔNG implement | P2 |
| G21 | Finish Button + URL redirect | Schema có `passUrl`/`failUrl`, Player KHÔNG implement | P2 |

**Tổng: 21 gaps thực (giảm từ 25 do 4 task đã hoàn thành)**

---

## PHASES VÀ TASKS CHI TIẾT

### PHASE 1: LỖI CRITICAL — Không có thì app vô dụng (P0)

#### T1: Player — Shuffle câu hỏi & đáp án
**Files:**
- `apps/player/src/store/playerStore.ts` — hàm khởi tạo quiz

**Yêu cầu:**
1. Đọc `quiz.settings.randomization.randomizeQuestions`. Nếu true → Fisher-Yates shuffle mảng questions.
2. Lưu `originalIndex` trên mỗi question để map ngược khi nộp bài.
3. Đọc `quiz.settings.randomization.randomizeOptions`. Nếu true → shuffle `options` cho multiple_choice, multiple_response.
4. Matching: shuffle cột phải (match), giữ nguyên cột trái (choice).
5. Sequence: shuffle items (đây LÀ câu hỏi — HS phải xếp lại).
6. Word bank: shuffle word pool.
7. **KHÔNG shuffle** true_false (chỉ có 2 option cố định), fill_in_blank, short_essay, click_map, blank_page.

**Kiểm tra:** Tạo quiz 20 câu, bật shuffle, chạy Player 3 lần — thứ tự khác nhau.

---

#### T2: Player — Chế độ nộp cả bài (all_at_once)
**Files:**
- `apps/player/src/store/playerStore.ts` — thêm `submitAllAtOnce()` action
- `apps/player/src/components/QuizPlayer.tsx` — ẩn/hiện nút theo mode

**Yêu cầu:**
1. Đọc `quiz.settings.submission.mode`:
   - `"per_question"` (mặc định): giữ nguyên hành vi hiện tại.
   - `"all_at_once"`: ẩn nút "Nộp câu trả lời" từng câu, HS tự do di chuyển, cuối cùng bấm "Nộp bài thi" → validate TẤT CẢ → chuyển result.
2. Khi `all_at_once` + `showCorrectAfterSubmit: false`: không hiện feedback sau khi nộp.
3. Nút "Nộp bài thi" luôn visible ở footer khi mode = all_at_once.

**Kiểm tra:** Quiz 10 câu, mode all_at_once — làm bài tự do, nộp 1 lần, score đúng.

---

#### T3: Player — Render media trong câu hỏi
**Files:**
- `apps/player/src/components/QuizPlayer.tsx` — thêm media display trước question text
- `apps/player/src/renderers/ClickMapPlayer.tsx` — fix `mapImageData` logic

**Yêu cầu:**
1. Trong `QuizPlayer.tsx`, trước khi render question text, kiểm tra `question.media`:
   - `type === 'image'`: render `<img src={base64 hoặc blob URL}>` với `max-h-64 w-auto mx-auto rounded-lg`.
   - `type === 'audio'`: render `<audio controls>`.
   - `type === 'video'`: render `<video controls>` với max-height.
2. `ClickMapPlayer.tsx:12` đang dùng `question.mapImage?.data` — cần sửa thành đúng field `question.media`.
3. Nếu media null/lỗi: hiện placeholder icon (không crash).
4. Kiểm tra `export_commands.rs` xem quiz.dat có include media data không. Nếu chưa → phải thêm.

**Kiểm tra:** Tạo quiz có ảnh trong MC question, export bundle, Player hiện ảnh.

---

#### T4: Player — Áp dụng Theme từ quiz data
**Files:**
- `apps/player/src/App.tsx` — set CSS custom properties khi load quiz
- `apps/player/src/index.css` — thêm CSS variables
- `apps/player/src/components/QuizPlayer.tsx` — thay hardcoded colors
- `apps/player/src/components/ResultScreen.tsx` — thay hardcoded colors

**Yêu cầu:**
1. Trong `App.tsx`, sau khi load quiz thành công, set trên `:root`:
   ```css
   --qf-primary: {theme.primaryColor};
   --qf-bg: {theme.backgroundColor};
   --qf-text: {theme.textColor};
   --qf-font: {theme.fontFamily};
   --qf-font-size: {theme.fontSize}px;
   --qf-rounded: {theme.roundedCorners ? '0.5rem' : '0'};
   ```
2. Thay TẤT CẢ hardcoded `bg-brand-600`, `text-brand-*` trong Player components bằng CSS variables.
3. Áp dụng `progressStyle` cho progress bar (bar/dots/number).
4. Áp dụng `navigationStyle` cho layout (buttons/sidebar/floating).
5. Áp dụng `showTimer` để ẩn/hiện timer.

**Kiểm tra:** Tạo quiz, chọn màu đỏ trong ThemeEditor, export, Player hiện đúng màu đỏ.

---

#### T5: Creator — Nhóm câu hỏi CRUD + Tree view
**Files:**
- `apps/creator/src/pages/QuizEditor.tsx` — tree view (hiện tại line 530-548 chỉ hiện types)
- `apps/creator/src-tauri/src/commands/question_commands.rs` — thêm group commands
- `apps/creator/src-tauri/src/database/mod.rs` — group queries

**Yêu cầu:**
1. **Tree View** phải hiện:
   - "Tất cả câu hỏi" — root (tổng)
   - Nhóm con: "Chủ đề 1 (15)", "Chủ đề 2 (20)", "Chưa phân nhóm (5)"
   - Dropdown "Sắp xếp theo nhóm" / "Sắp xếp theo loại" (như QuizCreator ảnh 21)
   - Click nhóm → filter bảng
2. **Group CRUD:**
   - Right-click tree → "Thêm nhóm mới"
   - Right-click nhóm → "Đổi tên" / "Xóa" (xóa nhóm → câu hỏi về "Chưa phân nhóm")
3. **Move to Group:**
   - Right-click câu hỏi(s) → "Chuyển đến nhóm..." → submenu
   - Hỗ trợ multi-select (Ctrl+Click)
4. **Rust commands:**
   - `create_question_group(quiz_id, name) -> String`
   - `rename_question_group(quiz_id, old_name, new_name)`
   - `delete_question_group(quiz_id, name)` — SET `group = NULL`
   - `move_questions_to_group(question_ids: Vec<String>, group: Option<String>)`
5. **DB:** Dùng `question.group` TEXT nullable hiện có. Không cần bảng mới.

**Kiểm tra:** Tạo 3 nhóm, phân 20 câu, di chuyển giữa nhóm, xóa 1 nhóm, verify tree counts.

---

### PHASE 2: TÍNH NĂNG QUAN TRỌNG (P1)

#### T6: Player — Xem lại bài làm (Result Review)
**Files:**
- `apps/player/src/store/playerStore.ts` — thêm `startReview()` action
- `apps/player/src/components/QuizPlayer.tsx` — review mode rendering
- `apps/player/src/components/ResultScreen.tsx` — wire onClick cho nút "Xem lại" (line 104-106)

**Yêu cầu:**
1. Nút "Xem lại bài làm" (`ResultScreen.tsx:105`) → gọi `startReview()`.
2. `startReview()` set `phase = 'reviewing'`, `currentQuestionIndex = 0`.
3. Trong reviewing mode:
   - Inputs disabled (read-only).
   - Đáp án HS: viền xanh (đúng) hoặc đỏ (sai).
   - Đáp án đúng: highlight xanh lá + checkmark.
   - Điểm mỗi câu: "+10đ" hoặc "0đ".
   - Không có nút submit, chỉ Prev/Next.
4. Footer: "Câu X/Y" + "Quay lại kết quả".
5. Outline panel: xanh (đúng), đỏ (sai), xám (chưa trả lời).

---

#### T7: Player — Random N câu từ ngân hàng
**Files:**
- `apps/player/src/store/playerStore.ts` — logic chọn N câu

**Yêu cầu:**
1. Đọc `quiz.settings.randomization.randomCount`.
2. Nếu `randomCount > 0 && randomCount < questions.length`:
   - Chọn ngẫu nhiên N câu (Fisher-Yates partial shuffle hoặc reservoir sampling).
   - RỒI mới áp dụng shuffle nếu `randomizeQuestions = true`.
3. Nếu `randomCount = 0` hoặc undefined: dùng tất cả câu (hành vi hiện tại).
4. Tổng điểm trên ResultScreen phải tính theo N câu được chọn, KHÔNG phải tổng quiz.

**Kiểm tra:** Quiz 30 câu, set randomCount = 10, chạy 3 lần — mỗi lần 10 câu khác nhau.

---

#### T8: Quiz Properties — Tab "Cài đặt Câu hỏi"
**Files:**
- `apps/creator/src/components/QuizPropertiesDialog.tsx` — Tab 4 (line 424-448, hiện placeholder)

**Yêu cầu (khớp QuizCreator ảnh 17 + 40):**
1. Section "Thuộc tính câu hỏi":
   - Checkbox: Xáo trộn đáp án mặc định
   - Checkbox: Cho phép tính điểm từng phần (partial scoring)
2. Section "Font chữ":
   - Font câu hỏi: family picker + size + bold/italic/color
   - Font đáp án: family picker + size + bold/italic/color
3. Section "Phản hồi":
   - Dropdown: "Sau mỗi câu" / "Sau bài thi" / "Không hiện"
   - Preview nhãn "Chính Xác" / "Không Đúng" với font styling
4. Lưu vào `quiz.settings` (cần mở rộng schema nếu chưa có field).

---

#### T9: Player — Thu thập thông tin thí sinh
**Files:**
- `apps/player/src/components/StudentSelector.tsx` — thêm form mode
- `apps/player/src/store/playerStore.ts` — lưu collected data

**Yêu cầu:**
1. Đọc `quiz.information.collectParticipantData`:
   - Nếu `enabled = true` VÀ không có student list → hiện form với các field trong `fields[]`.
   - Nếu có student list → giữ student picker hiện tại.
2. Form fields theo `fields[]`: name, email, student_id, class.
3. Validate tất cả required fields trước khi cho bắt đầu.
4. Data chảy vào `selectedStudent` trong playerStore.

---

#### T10: Publish Dialog — Tóm tắt quiz
**Files:**
- `apps/creator/src/components/ExportDialog.tsx` — thêm header (hiện 210 dòng)

**Yêu cầu (khớp QuizCreator ảnh 10-11):**
1. Header tóm tắt: Tên bài | Số câu | Tổng điểm | Tỷ lệ đạt.
2. Dropdown format: EXE (mặc định), Web/HTML5, SCORM (đánh dấu "Sắp có").
3. Folder picker cho output location.
4. Progress bar khi export.

---

#### T11: Player — Màn hình mật khẩu + Thông tin bài thi
**Files:**
- `apps/player/src/components/PasswordScreen.tsx` — NEW
- `apps/player/src/components/QuizInfoScreen.tsx` — NEW
- `apps/player/src/store/playerStore.ts` — thêm phases `'password' | 'info'`

**Yêu cầu (khớp ảnh 34-35):**
1. Flow: Password (nếu có) → Info Summary → Student Select → Quiz.
2. **Màn hình mật khẩu:**
   - Tên bài thi
   - Input "Mật Khẩu:" + nút OK
   - Validate bằng Tauri invoke (so sánh hash, KHÔNG gửi plain text)
3. **Màn hình thông tin:**
   - Tên bài thi (to, đậm)
   - Danh sách nhóm câu hỏi (expand/collapse)
   - Bảng: Tổng câu hỏi | Tổng điểm | Tỷ lệ đạt (%) | Điểm đạt
   - Nút "Bắt Đầu"

---

#### T12: Result fallback — Lưu .qfr khi mất LAN
**Files:**
- `apps/player/src/store/playerStore.ts` — `finishQuiz()` fallback
- `apps/player/src-tauri/src/commands/network.rs` — `save_result_local` command
- `apps/creator/src/pages/Dashboard.tsx` — nút "Import kết quả"

**Yêu cầu:**
1. Khi LAN submit thất bại → lưu file `{bundle_dir}/results/{studentId}_{timestamp}.qfr` (JSON).
2. Toast: "Kết quả đã lưu tại máy. Vui lòng gửi file cho giáo viên."
3. Creator Monitor tab: nút "Import kết quả" → file picker `.qfr` → insert vào DB.

---

#### T13: Import từ Word
**Files:**
- `apps/creator/src/components/ImportWordDialog.tsx` — NEW
- `apps/creator/src/pages/WelcomeScreen.tsx` — fix nút "Từ Word" (hiện trỏ sai sang ImportExcelDialog)

**Yêu cầu (khớp ảnh 29-30 + Untitled.doc):**
1. Sửa WelcomeScreen nút "Từ Word" → mở ImportWordDialog riêng.
2. Template Word dạng bảng 2 cột (Question Type | Questions).
3. Parse `.docx` (OOXML) bằng npm package.
4. Map table rows → Question objects theo type label.
5. Preview trước khi import.

---

#### T14: Outline enhancement — Dot indicators + Validation alerts
**Files:**
- `apps/player/src/components/QuizPlayer.tsx` — thêm dot row + alert

**Yêu cầu (khớp ảnh 36-38):**
1. Dãy chấm tròn ●●●● ở đầu trang (đã trả lời = filled, chưa = hollow, hiện tại = highlighted).
2. Khi submit trống → popup dialog: "Bạn phải chọn đáp án trước khi xem kết quả!"
3. Dùng `@tauri-apps/plugin-dialog` (đã có), KHÔNG dùng `window.alert`.

---

### PHASE 3: ĐÁNH BÓNG (P2)

#### T15: Modified indicator
**Files:**
- `apps/creator/src/pages/QuizEditor.tsx` — wire `hasUnsavedChanges` lên status bar
- Các components add/edit/delete question → gọi `setHasUnsavedChanges(true)`

**Yêu cầu:**
1. `appStore.hasUnsavedChanges` đã có (line 23-24). Wire lên UI.
2. Status bar hiện "Đã sửa đổi" khi dirty.
3. Save → `setHasUnsavedChanges(false)`.
4. Navigate away khi dirty → confirm dialog.

---

#### T16: Rich text pass/fail messages
**Files:**
- `apps/creator/src/components/QuizPropertiesDialog.tsx` — Tab 3 (line 325-370)
- `apps/player/src/components/ResultScreen.tsx`

**Yêu cầu:**
1. Thay textarea bằng RichTextEditor (TipTap đã có trong project).
2. Hỗ trợ bold, italic, color, font size.
3. Lưu HTML vào `quiz.resultSettings.passMessage` / `failMessage`.
4. Player render bằng `dangerouslySetInnerHTML`.

---

#### T17: Font customization
**Files:**
- `apps/creator/src/components/QuizPropertiesDialog.tsx` — Tab 4
- Player renderers

**Yêu cầu:**
1. Lưu font settings vào schema (mở rộng `quiz.settings` nếu cần).
2. Export font trong quiz.dat.
3. Player: `style={{ fontFamily, fontSize }}` trên question/answer containers.

---

#### T18: Tab "Khác" — Email + Page Meta
**Files:**
- `apps/creator/src/components/QuizPropertiesDialog.tsx` — thêm tab hoặc section

**Yêu cầu:**
1. Email notification: checkbox + input email. Đánh dấu "Tính năng sắp có".
2. Page Meta: keywords + description (cho web publish).

---

#### T19: Per-question time limit
**Files:**
- `packages/types/src/quiz.ts` — mở rộng `timeLimit` schema
- `apps/player/src/store/playerStore.ts` — per-question timer

**Yêu cầu:**
1. Thêm vào schema: `timeLimitMode: 'quiz' | 'per_question'`, `perQuestionSeconds: number`.
2. Player: nếu per-question → đếm ngược mỗi câu, hết giờ → auto-submit câu đó → next.

---

#### T20: Attempt limit + Resume
**Files:**
- `apps/player/src/store/playerStore.ts` — localStorage tracking

**Yêu cầu:**
1. `submission.oneAttemptOnly = true` → lưu attempt count vào localStorage (`qf_attempt_{quizId}_{studentId}`).
2. `submission.promptResume = true` → lưu progress mỗi 30s, hỏi resume khi mở lại.

---

#### T21: Finish Button + URL redirect
**Files:**
- `apps/player/src/components/ResultScreen.tsx`

**Yêu cầu:**
1. Đọc `quiz.resultSettings.finishButton`:
   - `passUrl` / `failUrl` → redirect sau khi thi.
2. Nút "Kết thúc", "In kết quả" dựa trên settings.

---

## THỨ TỰ THỰC HIỆN

```
Phase 1 (P0) — 5 tasks, ~5 sessions:
  T1 Shuffle         ← nhỏ, critical nhất cho exam integrity
  T3 Media render    ← chặn visual testing
  T2 Submission mode ← core exam flow
  T4 Theme apply     ← visual, large
  T5 Question groups ← creator productivity

Phase 2 (P1) — 9 tasks, ~6-8 sessions:
  T7  Random N       ← nhỏ, high value
  T6  Result review  ← player feature
  T11 Password/Info  ← player feature
  T14 Outline dots   ← nhỏ, polish
  T9  Participant    ← player feature
  T8  Question tab   ← creator feature
  T10 Publish dialog ← creator feature
  T12 Result fallback← reliability
  T13 Word import    ← large

Phase 3 (P2) — 7 tasks, ~4-5 sessions:
  T15 Modified flag  ← nhỏ, wire existing code
  T16 Rich text      ← medium
  T17 Font custom    ← medium
  T18 Others tab     ← nhỏ, mostly placeholder
  T19 Per-Q timer    ← schema change + logic
  T20 Attempt/Resume ← localStorage + UI
  T21 Finish/Redirect← nhỏ
```

**Tổng: 21 tasks, ~15-18 sessions**

---

## DEPENDENCY GRAPH

```
T1 (Shuffle) ──────────────┐
T2 (Submission modes) ──────┤
T3 (Media render) ──────────┤──→ Player core hoàn chỉnh
T4 (Theme apply) ───────────┤
T7 (Random N) ─── phụ thuộc T1 (shuffle sau khi chọn N)

T5 (Groups) ───────────────────→ Standalone

T11 (Password/Info) ───────┐
T9 (Participant data) ─────┤──→ Player intro flow hoàn chỉnh
T14 (Outline dots) ────────┘

T6 (Result review) ────────┐
T12 (Result fallback) ─────┤──→ Result flow hoàn chỉnh
T21 (Finish/Redirect) ─────┘

T8  (Question tab) ─── phụ thuộc T17 (font settings)
T16 (Rich text) ──────────────→ Standalone
T13 (Word import) ────────────→ Standalone
T19 (Per-Q timer) ─── phụ thuộc T2 (submission mode affects timer behavior)
T20 (Attempt/Resume) ─────────→ Standalone
```

---

## TESTING CHECKLIST

### Test A: Full Quiz Flow (sau Phase 1)
- [ ] Tạo quiz 30 câu, 3 nhóm, đủ 10 loại
- [ ] Bật shuffle + time limit 30 phút + passing rate 60%
- [ ] Thêm ảnh cho 5 câu MC
- [ ] Chọn theme: màu đỏ, font Inter, progressStyle = dots
- [ ] Đặt password
- [ ] Export Player bundle
- [ ] Mở Player → nhập password → xem info → chọn HS → bắt đầu
- [ ] Verify: câu hỏi xáo trộn, ảnh hiển thị, màu đỏ đúng theme
- [ ] Verify: outline panel hoạt động

### Test B: Submission + Review (sau T2, T6)
- [ ] Mode all_at_once: làm tự do, nộp 1 lần, score đúng
- [ ] Mode per_question: nộp từng câu, feedback hiển thị
- [ ] "Xem lại bài làm" → hiện đáp án đúng/sai, read-only

### Test C: Random N + Timer (sau T7, T19)
- [ ] Set randomCount = 10 / 30 câu → mỗi lần 10 câu khác
- [ ] Per-question timer 15s → hết giờ auto-advance

### Test D: Network + Fallback (sau T12)
- [ ] Kết quả gửi LAN thành công
- [ ] Tắt mạng → kết quả lưu .qfr
- [ ] Import .qfr vào Creator

### Test E: Import (sau T13)
- [ ] Import Excel (đã có) → verify đúng
- [ ] Import Word → verify đúng

---

## QUY TẮC CHO AI AGENTS

1. **NO `any` TypeScript** — dùng `unknown` + Zod parse
2. **ALL forms**: TanStack Form + Zod validation
3. **ALL async**: TanStack Query wrapping `invoke()`
4. **ALL UI strings tiếng Việt** — không lẫn tiếng Anh
5. **Loading/error/empty states** trên mọi component
6. **NO `.unwrap()` panics** trong Rust — dùng `?` operator
7. **Test sau mỗi task** — `pnpm typecheck` + `pnpm test` PHẢI pass
8. **Đọc file TRƯỚC khi sửa.** Hiểu context.
9. **Thay đổi tối thiểu.** Không refactor code không liên quan.
10. **Schema change** → update `@quizforge/types` TRƯỚC, rồi consumers.
11. **Import features** → dùng npm packages frontend (`xlsx`, `mammoth`), không cần Rust.
12. **Preview/Player** → tái sử dụng renderer components, không duplicate.
13. **Dùng ĐÚNG field paths** (xem section "SCHEMA THỰC TẾ" ở trên). KHÔNG đoán.

---

## NGOÀI PHẠM VI

- **Survey Mode** — module riêng biệt hoàn toàn, sẽ xem xét sau MVP.
- **Auto-updater** — cần server + ed25519 key, không liên quan tính năng.
- **SCORM export** — chỉ lưu placeholder UI, implement khi có yêu cầu LMS cụ thể.
