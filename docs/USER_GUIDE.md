# 📘 Hướng Dẫn Sử Dụng QuizForge Toàn Tập
*(Dành cho Giáo viên và Người tổ chức thi)*

Chào mừng thầy/cô đã đến với **QuizForge** – phần mềm giúp tạo, xuất bản bài thi thành phần mềm độc lập (.exe) và thu bài qua mạng LAN một cách bảo mật, nhanh chóng.

QuizForge đặc biệt hữu ích khi tổ chức thi offline trong phòng máy nhà trường, không cần phụ thuộc vào đường truyền Internet. Tính năng bảo mật mã hóa AES-256-GCM đảm bảo học sinh không thể gian lận hay can thiệp vào đề thi.

---

## 🎯 Tổng quan về Cách thức Hoạt động

QuizForge bao gồm 2 phần chính:
1. **QuizForge Creator (Dành cho Giáo viên)**: Ứng dụng thầy/cô tải về và cài đặt lên máy tính cá nhân. Dùng để tạo bộ câu hỏi, lập danh sách học sinh, trộn đề và "Xuất bản" (Publish) bài thi.
2. **QuizForge Player (Dành cho Học sinh)**: Ứng dụng để học sinh làm bài. Điểm khác biệt là: **Học sinh không cần tải ứng dụng Player**. Khi thầy/cô xuất bản một bài thi trên Creator, phần mềm sẽ tự "đóng gói đẻ ra" một file chạy duy nhất (ví dụ: `KT_15P_Toan.exe`). Thầy/cô chỉ việc copy file này gửi cho học sinh là xong.

---

## 🔑 Phần 1: Cài đặt Phần mềm Creator

1. Truy cập trang Tải về để tải file cài đặt (VD: `QuizForge Creator_1.0.0_x64-setup.exe`).
2. Mở file cài đặt lên, chỉ cần bấm **Next** và **Finish** như mọi phần mềm thông dụng khác.
3. Ứng dụng sẽ tự động được đưa ra màn hình Desktop (Màn hình chính) của máy tính. Nhấp đúp chuột vào biểu tượng "QuizForge Creator" để khởi động.

*(Mẹo: Khi cài đặt, phần mềm đã âm thầm tạo sẵn một cơ sở dữ liệu riêng, cực nhẹ và bảo mật. Thầy/cô không cần lo về việc mất mạng hay đăng ký tài khoản)*

---

## 🛠️ Phần 2: Quản lý Ngân hàng Câu hỏi

QuizForge lưu mọi câu hỏi vào một "Ngân hàng" chung, giúp thầy/cô dễ dàng lấy lại câu hỏi cũ cho những lần kiểm tra sau mà không cần gõ lại.

### Hướng dẫn Thêm mới câu hỏi:
1. Từ **Bảng điều khiển (Dashboard)** ở cột bên trái, hãy bấm vào menu **"Câu hỏi"**.
2. Góc trên cùng bên phải, nhấp vào nút **"+ Thêm câu hỏi"**.
3. Một bảng chọn hiện ra:
   - **Chọn loại**: Trắc nghiệm, Tự luận, Câu hỏi Ghép nối (Nối chữ).
   - **Độ khó**: Dễ, Trung bình, Khó.
   - **Gắn Tag**: Nhập các từ khóa giúp phân loại (ví dụ: "Chương 1", "HK2").
4. **Nhập Nội dung câu hỏi**: Trình soạn thảo giống hệt Microsoft Word. Thầy/cô có thể in đậm chữ, đổi màu, hoặc nhấp vào nút hình bức ảnh để **Chèn Ảnh/Video**.
5. Nhập các đáp án và tích chọn vào **Ô tròn** cạnh đáp án đúng.
6. Kết thúc bằng nút **"Lưu"**. Vậy là câu hỏi đã vào kho!

---

## 👩‍🎓 Phần 3: Quản lý Danh sách Thí sinh (Option/Không bắt buộc)

Tính năng này giúp thầy/cô điểm danh và chống thi hộ. Khi học sinh mở bài thi lên, các em sẽ ấn vào ô mã học sinh/tên mình thay vì tự gõ tay (Hạn chế việc gõ sai tên).

1. Ở cột bên trái, bấm vào menu **"Học sinh"**.
2. Chọn **"+ Danh sách mới"**, điền tên lớp (VD: `Lớp 12A1`).
3. Trong lớp đó, thầy/cô có thể bấm **Thêm học sinh** bằng tay từng người, hoặc bấm mục **"Nhập từ File Excel"** (Nhớ tải file mẫu của hệ thống về và làm theo hướng dẫn trong file).

---

## 📝 Phần 4: Tạo một Bài Kiểm Tra

1. Chọn mục **"Quản lý Đề thi" (Quizzes)**.
2. Bấm **"+ Tạo đề mới"**.
3. Ở Tab **"Thông tin chung"**: Điền tên đề thi, mô tả (nếu có).
4. Ở Tab **"Chọn câu hỏi"**:
   - Mở màn hình kho câu hỏi lên, khoanh chọn những câu hỏi muốn lấy.
   - Hoặc có thể chọn tính năng **"Ramdom (Lấy ngẫu nhiên)"** dựa theo bộ Tag đã nhập ở phần 2.
5. Ở Tab **"Cài đặt"**: Tích chọn những tính năng mong muốn:
   - Xáo trộn thứ tự câu hỏi.
   - Thời gian làm bài (Phút).
   - Danh sách lớp làm bài thi (Nếu bỏ trống, hệ thống cho học sinh tự gõ tên tự do. Nếu chọn lớp VD: 12A1, thì file bài thi lát sản xuất ra sẽ CỨNG danh sách lớp này lên).
6. Bấm **Lưu Bài thi**.

---

## 🚀 Phần 5: Xuất bản và "Bắt đầu thu bài" (Publish)

Đây là chức năng quan trọng nhất của phần mềm. Bài thi sau khi lưu mới nằm trên màn hình của giáo viên thôi. Bạn phải "Phân phối" nó thành 1 cục file `Phần-mềm-bài-thi.exe`

1. Tại màn hình DS Đề thi, chọn vào bài thi mới tạo, bấm nút **"Xuất bản"** dạng đám mây mũi tên lên.
2. Ở cửa sổ bật lên, bấm chọn hình thức xuất là **"Windows Application (.exe)"**.
3. Cửa sổ lưu file hệ điều hành bật lên. Thầy/cô chọn chỗ lưu (VD ở Desktop) rồi đặt tên (Ví dụ: `15PhutToan`). Bấm nút `Lưu (Save)`.
4. Lúc này máy tính sẽ xoay tít để "đóng gói". Đợi 5 giây báo Hoàn Thành!
5. **Gửi File cho HS**: Bây giờ hãy lấy file `15PhutToan.exe` đó, đưa lên Zalo, Group Facebook lớp, hoặc chép USB qua các máy trong trung tâm. (File chạy nhẹ và có tính năng chống copy nên cực an toàn).

> 💡 **Quan trọng về kết quả:** Thầy cô cần bật tính năng "Thu bài" trước khi HS nộp.
> Vào mục **"Mạng LAN (Kết nối)"** bên cột trái --> Bấm Nút Tròn Nhấn Chuyển trạng thái để **"Phát sóng thu bài"**.
> Hệ thống sẽ báo 1 dãy `IP và Cổng` mạng LAN. Để đó không tắt, chờ HS nộp bài nó tự nhảy dữ liệu vào.


## 📊 Phần 6: Xem Lịch Sử và Xuất Excel

1. Học sinh bấm "Nộp" ở cuối bài thi, nếu máy báo "Nộp thành công", điểm tự động nảy số về máy chủ của thầy cô trong nhánh LAN.
2. Thầy cô vào Menu **"Kết quả"**. Màn hình thể hiện trọn vẹn lớp nào làm, điểm trung bình bao nhiêu, câu nào sai nhiều.
3. Bấm **"Mũi Tên Download"** góc phải để Lưu thành tệp danh sách File Excel in ra cho phụ huynh tiện theo dõi.

*Cảm ơn sự ủng hộ của thầy/cô! Hãy cùng QuizForge kiến thiết lớp học số hiệu quả hơn.*
