# KẾ HOẠCH HOÀN THIỆN QUIZFORGE — Bản cho người đọc

> Ngày tạo: 2026-03-10 | Cập nhật: 2026-03-10 (hợp nhất, đã audit toàn bộ code)
> Nguồn: 40 ảnh QuizCreator + 2 file template (Excel/Word) + kiểm tra từng dòng code
> Mục tiêu: QuizForge hoạt động mượt mà như Wondershare QuizCreator

---

## TỔNG QUAN

Sau khi phân tích **40 ảnh chụp** QuizCreator, **2 file template** (Excel + Word), và **kiểm tra từng file trong codebase**, tôi xác định được **21 gaps thực sự** cần làm.

> **Lưu ý:** Kế hoạch ban đầu liệt kê 25 tasks. Sau khi audit code, phát hiện **4 task đã hoàn thành** mà không biết:
> - Timer tự nộp khi hết giờ ✅
> - Thanh trạng thái hiện thống kê ✅
> - Toolbar chèn media trong editor ✅
> - Outline câu hỏi trong Player ✅
>
> Kế hoạch này đã **loại bỏ** các task đó và **sửa tất cả thông tin sai**.

### Điểm mạnh hiện tại (đã kiểm chứng):
- ✅ 10 loại câu hỏi đầy đủ (editor + renderer)
- ✅ Giao diện Ribbon giống Office
- ✅ Drag-drop sắp xếp câu hỏi
- ✅ Export .qfz + Player bundle AES-256-GCM
- ✅ LAN monitoring real-time
- ✅ Timer đếm ngược + tự nộp khi hết giờ
- ✅ Thanh trạng thái: tên bài, số câu, tỷ lệ đạt, tổng điểmz
- ✅ Toolbar chèn ảnh/âm thanh/video trong editor câu hỏi
- ✅ Outline câu hỏi (panel số câu, click nhảy)
- ✅ ThemeEditor hoàn chỉnh (2 tab, live preview, color picker)
- ✅ Import từ Excel (backend Rust đã implement)
- ✅ Anti-cheat lockdown
- ✅ 0 lỗi TypeScript, 0 lỗi Rust, 76 unit tests pass

---

## PHASE 1: LỖI CRITICAL — Không có thì app vô dụng

### 1. Player — Xáo trộn câu hỏi & đáp án
**Vấn đề:** QuizCreator xáo trộn cả câu hỏi lẫn đáp án. QuizForge lưu cài đặt nhưng Player **không xáo trộn gì cả**.
**Ảnh hưởng:** Học sinh ngồi cạnh nhau copy đáp án → bài thi vô nghĩa.
**Giải pháp:** Khi bắt đầu làm bài, xáo trộn theo thuật toán Fisher-Yates. Giữ nguyên index gốc để tính điểm đúng.

### 2. Player — Chế độ nộp cả bài (all_at_once)
**Vấn đề:** QuizCreator có 2 chế độ nộp bài. QuizForge chỉ có "từng câu".
**Giải pháp:** Thêm mode "Nộp cả bài" — ẩn nút nộp từng câu, học sinh làm tự do, cuối cùng nộp 1 lần.

### 3. Player — Hiển thị ảnh/media trong câu hỏi
**Vấn đề:** Giáo viên đính kèm ảnh trong câu hỏi nhưng Player **không hiện ảnh**. Data có trong quiz bundle nhưng không renderer nào hiển thị.
**Giải pháp:** Thêm `<img>` / `<audio>` / `<video>` trước text câu hỏi khi có media.

### 4. Player — Áp dụng Theme/Giao diện
**Vấn đề:** Creator có ThemeEditor hoàn chỉnh (chọn màu, font, layout). Nhưng Player **bỏ qua hoàn toàn** — luôn hiện giao diện mặc định dù giáo viên đã chỉnh.
**Giải pháp:** Player đọc theme từ quiz data, set CSS variables, thay thế tất cả màu hardcoded.

### 5. Creator — Quản lý nhóm câu hỏi
**Vấn đề:** QuizCreator có tree view nhóm bên trái (Chương 1, Chương 2...). QuizForge tree view **chỉ hiện theo loại câu hỏi**, không có nhóm tùy chỉnh.
**Giải pháp:** Thêm CRUD nhóm (tạo/đổi tên/xóa), right-click "Chuyển đến nhóm...", dropdown sắp xếp theo nhóm/loại.

---

## PHASE 2: TÍNH NĂNG QUAN TRỌNG

### 6. Player — Xem lại bài làm
**Vấn đề:** Nút "Xem lại bài làm" có nhưng **bấm không có gì xảy ra** (thiếu event handler).
**Giải pháp:** Hiện lại câu hỏi read-only, highlight đáp án đúng (xanh)/sai (đỏ), navigation Prev/Next.

### 7. Player — Chọn ngẫu nhiên N câu từ ngân hàng
**Vấn đề:** QuizCreator cho phép "Ra 30 câu ngẫu nhiên từ 100 câu". QuizForge chưa có.
**Tại sao quan trọng:** Bắt buộc cho thi thật — mỗi đề phải khác nhau.
**Giải pháp:** Chọn ngẫu nhiên N câu trước, rồi mới xáo trộn.

### 8. Quiz Properties — Tab "Cài đặt Câu hỏi" (đang trống)
**Vấn đề:** Tab 4 trong Quiz Properties dialog ghi "Not yet implemented".
**Giải pháp:** Thêm: shuffle đáp án mặc định, font chữ, cài đặt feedback.

### 9. Player — Form nhập thông tin thí sinh
**Vấn đề:** Khi không có danh sách HS, QuizCreator hiện form nhập (Họ tên, Lớp, MSSV). QuizForge chỉ có student picker từ danh sách có sẵn.
**Giải pháp:** Nếu không có student list → hiện form nhập liệu.

### 10. Publish Dialog — Tóm tắt quiz
**Vấn đề:** QuizCreator hiện tóm tắt quiz (tên, số câu, tổng điểm, tỷ lệ đậu) trước khi export. QuizForge không có.
**Giải pháp:** Thêm header tóm tắt + dropdown chọn format (EXE/Web/SCORM).

### 11. Player — Màn hình mật khẩu + Thông tin bài thi
**Vấn đề:** QuizCreator có màn hình nhập mật khẩu và trang thông tin bài thi trước khi bắt đầu. Player nhảy thẳng vào danh sách HS.
**Giải pháp:** Thêm flow: Mật khẩu → Thông tin bài thi (tổng câu, điểm, tỷ lệ đạt) → Chọn HS → Làm bài.

### 12. Lưu kết quả khi mất mạng LAN
**Vấn đề:** Nếu Player không kết nối được LAN → kết quả **MẤT**.
**Giải pháp:** Lưu file `.qfr` tại máy, giáo viên import sau.

### 13. Import từ Word
**Vấn đề:** WelcomeScreen có nút "Từ Word" nhưng **trỏ sai sang dialog Excel**. Chưa có parser Word riêng.
**Giải pháp:** Tạo dialog + parser riêng cho file Word (.docx dạng bảng).

### 14. Outline — Chấm tròn tiến độ + Cảnh báo
**Vấn đề:** Outline grid đã có nhưng thiếu dãy chấm ●●●● ở đầu trang và popup cảnh báo khi submit trống.
**Giải pháp:** Thêm dot indicators + dialog "Bạn phải chọn đáp án trước khi xem kết quả!"

---

## PHASE 3: ĐÁNH BÓNG

### 15. Indicator "Đã sửa đổi"
**Vấn đề:** Code đã có flag `hasUnsavedChanges` nhưng **không hiện trên UI**.
**Giải pháp:** Wire flag lên status bar, hỏi xác nhận khi thoát.

### 16. Rich text thông báo Đậu/Trượt
Thay textarea bằng TipTap editor (đã có trong project).

### 17. Tùy chỉnh font câu hỏi/đáp án
Áp dụng font settings từ Quiz Properties vào Player.

### 18. Tab "Khác" — Email + Page Meta
Lưu setting email (đánh dấu "Sắp có"). Thêm keywords/description cho web publish.

### 19. Giới hạn thời gian mỗi câu
Thêm chế độ timer per-question ngoài timer toàn bài hiện có.

### 20. Giới hạn số lần làm bài + Tiếp tục bài thi
Lưu attempt count + progress vào localStorage.

### 21. Nút Kết thúc + Chuyển hướng URL
Nút "Kết thúc" + redirect URL khi đậu/trượt (settings đã có trong schema).

---

## NGOÀI PHẠM VI

### Survey Mode (Chế độ khảo sát)
QuizCreator có module khảo sát riêng (Likert Scale, Yes/No, Ranking...). **KHÔNG LÀM** trong giai đoạn này — đây là module hoàn toàn mới, cần schema + UI riêng.

---

## BẢNG TỔNG HỢP

| Phase | Số task | Ưu tiên | Mô tả |
|-------|---------|---------|-------|
| Phase 1 | 5 | P0 | Shuffle, submission mode, media, theme, groups |
| Phase 2 | 9 | P1 | Review, random N, quiz properties, password, fallback, Word import |
| Phase 3 | 7 | P2 | Modified flag, rich text, font, per-Q timer, attempts, redirect |
| **Tổng** | **21** | | **~15-18 sessions AI Agent** |

---

## THỨ TỰ THỰC HIỆN

### Giai đoạn 1 — Critical (~5 sessions)
1. Xáo trộn câu hỏi + đáp án
2. Render media trong Player
3. Chế độ nộp cả bài
4. Áp dụng Theme
5. Quản lý nhóm câu hỏi

### Giai đoạn 2 — Important (~6-8 sessions)
6. Random N câu từ pool
7. Xem lại bài làm
8. Màn hình mật khẩu + thông tin
9. Chấm tròn tiến độ + cảnh báo
10. Form thông tin thí sinh
11. Tab "Cài đặt Câu hỏi"
12. Publish dialog tóm tắt
13. Lưu kết quả offline
14. Import từ Word

### Giai đoạn 3 — Polish (~4-5 sessions)
15. Modified indicator
16. Rich text Đậu/Trượt
17. Font customization
18. Tab "Khác"
19. Timer mỗi câu
20. Giới hạn lượt + Resume
21. Nút Kết thúc + Redirect

---

## CHECKLIST KIỂM TRA

### Test 1: Tạo đề thi hoàn chỉnh
- [ ] Tạo quiz 30 câu, 3 nhóm, đủ 10 loại
- [ ] Đính kèm ảnh cho 5 câu
- [ ] Bật shuffle + time limit 30 phút + tỷ lệ đạt 60%
- [ ] Chọn theme màu đỏ, font Inter
- [ ] Đặt mật khẩu

### Test 2: Export & Player
- [ ] Export Player bundle
- [ ] Nhập mật khẩu → xem thông tin bài thi → chọn HS
- [ ] Câu hỏi xáo trộn, ảnh hiển thị, màu đúng theme
- [ ] Mode "Nộp cả bài" → làm tự do → nộp 1 lần

### Test 3: Kết quả
- [ ] "Xem lại bài làm" → hiện đáp án đúng/sai
- [ ] Kết quả gửi LAN ✅
- [ ] Tắt mạng → lưu .qfr → import vào Creator

### Test 4: Random + Timer
- [ ] Random 10/30 câu → mỗi lần khác nhau
- [ ] Timer mỗi câu 15s → hết giờ auto chuyển

### Test 5: Import
- [ ] Import Excel → verify đúng
- [ ] Import Word → verify đúng

---

## LƯU Ý QUAN TRỌNG

1. **Kế hoạch này là bản CUỐI CÙNG** — đã cover toàn bộ 40 ảnh + 2 file template + audit code.
2. **Thứ tự:** Phase 1 → 2 → 3. KHÔNG nhảy giai đoạn.
3. **Mỗi task:** `pnpm typecheck` + `pnpm test` PHẢI pass.
4. **Tất cả UI tiếng Việt.** Không lẫn tiếng Anh.
5. **Survey Mode** ngoài scope.
6. Các file plan cũ (`FINISHPLAN_BATCH2.md`, `FINISHPLAN_HUMAN_BATCH2.md`) đã được gộp vào đây và có thể xóa.
