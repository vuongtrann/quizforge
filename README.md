<div align="center">
  <img src="apps/creator/src-tauri/icons/128x128.png" width="128" alt="QuizForge Logo" />
  <h1>QuizForge</h1>
  <p><strong>Nền tảng Tạo và Phân phối Bài thi Ngoại tuyến Tối ưu</strong></p>
  
  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.80+-F46623)](https://www.rust-lang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

**QuizForge** là một hệ thống (Monorepo) mạnh mẽ được thiết kế đặc biệt cho giáo viên và người tổ chức thi. Nó cung cấp giải pháp hoàn chỉnh từ khâu soạn thảo ngân hàng câu hỏi, thiết lập bài thi, phân phối đến học sinh dưới dạng phần mềm độc lập, đến tự động thu bài và chấm điểm qua mạng LAN — **hoàn toàn không cần Internet**.

## ✨ Tính năng Nổi bật (Key Features)

- 🔒 **Đóng gói file bài thi `.exe` duy nhất (Single Executable)**: Toàn bộ đề thi, thiết lập và danh sách thí sinh được nhúng bảo mật vào một phần mềm tự chạy. Người dùng chỉ cần gửi file này cho học sinh.
- 👨‍🏫 **Trình tạo đề thi (Creator) chuyên nghiệp**: Hỗ trợ nhiều loại câu hỏi (Trắc nghiệm, Tự luận, Trắc nghiệm nhiều lựa chọn, Nối chữ), định dạng văn bản nâng cao (Rich Text), và chèn đa phương tiện (Hình ảnh, Âm thanh, Video).
- 🛜 **Thu bài tự động qua mạng nội bộ (LAN Server)**: Học sinh làm bài xong, điểm tự động bắn về máy chủ của giáo viên thông qua sóng Wi-Fi/LAN chung mà không cần đến mạng Internet. Phù hợp cho phòng máy của trường học.
- 🛡️ **Bảo mật đề thi chuẩn AES-256-GCM**: Dữ liệu và đáp án được mã hóa quân sự. Tránh gian lận một cách triệt để trên máy học sinh.
- 📊 **Xuất bảng điểm Excel**: Tổng hợp và trích xuất điểm thi tự động hỗ trợ giáo viên vào sổ điểm nhanh chóng.

## 👥 Dành cho Người dùng (For Users / Teachers)

Vui lòng xem **[Sách Hướng dẫn Cài đặt & Sử dụng (User Guide)](docs/USER_GUIDE.md)** hoặc truy cập trang Releases để tải bộ cài đặt `.exe` mới nhất dành cho Windows.

---

## 💻 Dành cho Lập trình viên (For Developers)

Dự án này sử dụng kiến trúc **Monorepo** được quản lý bởi `pnpm` và `Turborepo`. Tầng frontend sử dụng **Vite + React + Tailwind CSS**, trong khi tầng backend desktop sử dụng **Tauri v2 + Rust + SQLite**.

### 1. Yêu cầu Hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)
- [Rust](https://www.rust-lang.org/tools/install) (Bản Stable mới nhất)
- (Windows) [Visual Studio C++ Build Tools](https://tauri.app/v1/guides/getting-started/prerequisites#windows)

### 2. Cài đặt và Chạy thử nghiệm (Setup & Dev)

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/QuizForge.git
cd QuizForge

# 2. Cài đặt toàn bộ thư viện cho các ứng dụng
pnpm install

# 3. Khởi chạy Creator Desktop ở chế độ lập trình nghiệm (Dev Mode)
pnpm run dev
```

### 3. Cấu trúc Thư mục (Project Architecture)

```text
QuizForge/
├── apps/
│   ├── creator/       # 🛠 Ứng dụng Quản lý & Soạn đề cho Giáo viên (Tauri + React)
│   ├── player/        # 🎮 Ứng dụng Làm bài thi cho Học sinh (Tauri + React)
│   └── player-shell/  #    Vỏ bọc (Shell) tích hợp cho Player
├── packages/
│   ├── ui/            # 🎨 Các component giao diện dùng chung (Shadcn UI)
│   └── types/         # 🏷️ TypeScript interfaces / Rust structs chia sẻ chung
├── docs/              # 📚 Tài liệu kỹ thuật, hướng dẫn sử dụng
└── package.json       # Định nghĩa Monorepo Workspace
```

### 4. Xây dựng Bản phát hành (Build Release)

Xin lưu ý, **QuizForge Player** không được phân phối độc lập. Luồng hoạt động là: Bạn phải biên dịch một phiên bản mẫu của Player (`template`), đưa nó vào `Creator`, và sau đó biên dịch bộ cài (Installer) cho `Creator`.

**Quy trình Build chuẩn Windows (NSIS Installer):**

```bash
# BƯỚC 1: Build file mẫu Player
pnpm -C apps/player tauri build --no-bundle

# BƯỚC 2: Copy file exe mẫu vào Creator làm tài nguyên
# (Lệnh copy trên PowerShell)
copy apps\player\src-tauri\target\release\quizforge-player.exe apps\creator\src-tauri\resources\player-template.exe

# BƯỚC 3: Xây dựng bộ cài NSIS cho ứng dụng Creator
pnpm -C apps/creator tauri build
```
Bộ cài đặt cuối cùng sẽ nằm tại: `apps/creator/src-tauri/target/release/bundle/nsis/QuizForge Creator_1.0.0_x64-setup.exe`

---

## 🤝 Hỗ trợ và Đóng góp
Dự án được tạo ra nhằm hỗ trợ cộng đồng giáo dục. Chúng tôi rất hoan nghênh những ý kiến đóng góp thông qua Pull Request (PR) hoặc báo lỗi qua Issues.

## 📜 Giấy phép
Sản phẩm được cấp phép sử dụng theo [MIT License](LICENSE).
