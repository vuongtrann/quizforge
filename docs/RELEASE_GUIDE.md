# QuizForge Release & Auto-Update Guide

## Mục lục
1. [Thiết lập ban đầu (1 lần)](#1-thiết-lập-ban-đầu)
2. [Quy trình CI/CD](#2-quy-trình-cicd)
3. [Quy trình phát hành phiên bản](#3-quy-trình-phát-hành-phiên-bản)
4. [Auto-Updater hoạt động như nào](#4-auto-updater-hoạt-động-như-nào)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Thiết lập ban đầu

### 1.1 Tạo Signing Key (Ed25519)

Tauri yêu cầu ký số (sign) các bản cập nhật. Chạy lệnh sau để tạo keypair:

```bash
# Cài Tauri CLI nếu chưa có
cargo install tauri-cli

# Tạo keypair
cargo tauri signer generate -w ~/.tauri/quizforge.key
```

Lệnh trên sẽ tạo:
- **Private key**: `~/.tauri/quizforge.key` (KHÔNG chia sẻ!)
- **Public key**: hiển thị trên terminal (dạng `dW50cnVzdGVkIGNvbW1lbnQ...`)

### 1.2 Cấu hình GitHub Secrets

Vào **GitHub repo → Settings → Secrets and variables → Actions**, thêm:

| Secret Name | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Nội dung file `~/.tauri/quizforge.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password bạn đặt khi tạo key |

### 1.3 Cập nhật Public Key trong config

Thay `REPLACE_WITH_YOUR_ED25519_PUBLIC_KEY` trong 2 file:
- `apps/creator/src-tauri/tauri.conf.json` → `plugins.updater.pubkey`
- `apps/player/src-tauri/tauri.conf.json` → `plugins.updater.pubkey`

### 1.4 Cập nhật Endpoint URL

Thay `YOUR_USERNAME` trong endpoint URL bằng tên GitHub user/org thực tế:

```
https://github.com/YOUR_USERNAME/QuizForce/releases/latest/download/creator-update.json
https://github.com/YOUR_USERNAME/QuizForce/releases/latest/download/player-update.json
```

---

## 2. Quy trình CI/CD

### Workflow tổng quan

```
Push/PR → ci.yml (typecheck + test + lint)
                ↓
Tag v* push → release.yml
                ├── CI checks
                ├── Build Creator (Windows) ──→ NSIS + MSI + Signatures
                ├── Build Player (Windows)  ──→ NSIS + MSI + Signatures
                └── Publish
                    ├── creator-update.json (update manifest)
                    ├── player-update.json  (update manifest)
                    └── GitHub Release (Draft)
```

### Các Workflow

| File | Trigger | Chức năng |
|---|---|---|
| `ci.yml` | Push `main`/`develop`, PR to `main` | TypeCheck, Test, Lint |
| `release.yml` | Tag `v*` hoặc manual dispatch | Build cả 2 app + Tạo Release |

### Artifacts được tạo

Mỗi lần release sẽ tạo:
- `QuizForge-Creator_x.x.x_x64-setup.exe` — NSIS installer (Creator)
- `QuizForge-Creator_x.x.x_x64-setup.exe.sig` — Chữ ký
- `QuizForge-Player_x.x.x_x64-setup.exe` — NSIS installer (Player)
- `QuizForge-Player_x.x.x_x64-setup.exe.sig` — Chữ ký
- `creator-update.json` — Update manifest cho Creator
- `player-update.json` — Update manifest cho Player

---

## 3. Quy trình phát hành phiên bản

### Bước 1: Bump version

```bash
# Bump tất cả files cùng lúc
bash scripts/bump-version.sh 0.2.0
```

Script sẽ cập nhật version trong:
- `package.json` (root + apps + packages)
- `tauri.conf.json` (creator + player)
- `Cargo.toml` (creator + player)

### Bước 2: Commit và tag

```bash
git add -A
git commit -m "chore: release v0.2.0"
git tag v0.2.0
```

### Bước 3: Push

```bash
git push origin main --tags
```

### Bước 4: Review và publish

1. GitHub Actions tự động chạy `release.yml`
2. Vào **GitHub → Releases** → Tìm draft release
3. Review release notes (tự generate từ commits)
4. Chỉnh sửa notes nếu cần
5. Nhấn **"Publish release"**

Sau khi publish, URL `latest/download/creator-update.json` sẽ tự trỏ đến release mới nhất → App tự phát hiện cập nhật.

---

## 4. Auto-Updater hoạt động như nào

### Luồng cập nhật (từ phía người dùng)

```
App khởi động
    ↓
Kiểm tra endpoint (GitHub Release)
    ↓
So sánh version trong manifest vs version hiện tại
    ↓
Nếu có bản mới → Hiện thông báo
    ↓
Người dùng chọn "Cập nhật ngay"
    ↓
Download installer (.exe) + verify chữ ký
    ↓
Chạy NSIS installer (passive mode — tự cài, không cần click)
    ↓
App restart với phiên bản mới
```

### Cách kiểm tra thủ công

Trong Creator app: **Settings → Cài đặt chung → "Kiểm tra cập nhật"**

### Install Modes

Cấu hình trong `tauri.conf.json` → `plugins.updater.windows.installMode`:

| Mode | Hành vi |
|---|---|
| `passive` | Cài tự động, hiện progress bar, không hỏi user |
| `basicUi` | Hiện UI cơ bản của NSIS |
| `quiet` | Cài hoàn toàn im lặng (không hiện gì) |

Hiện tại đang dùng `passive` — phù hợp nhất cho giáo dục.

### Update Manifest Format

```json
{
  "version": "0.2.0",
  "notes": "Release notes here",
  "pub_date": "2026-03-15T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "base64_ed25519_signature",
      "url": "https://github.com/.../QuizForge-Creator_0.2.0_x64-setup.exe"
    }
  }
}
```

---

## 5. Troubleshooting

### "Lỗi kiểm tra cập nhật" trong app

1. Kiểm tra `pubkey` trong `tauri.conf.json` khớp với private key dùng để ký
2. Kiểm tra endpoint URL đúng (thử mở trong browser)
3. Kiểm tra CSP cho phép `connect-src` đến `github.com`

### Build thất bại trên CI

1. Kiểm tra GitHub Secrets đã được set
2. Kiểm tra `pnpm-lock.yaml` đã commit (dùng `--frozen-lockfile`)
3. Xem logs trong GitHub Actions

### Signature mismatch

Private key (GitHub Secret) phải khớp với public key (tauri.conf.json). Nếu regenerate key, phải update cả hai.

### Thêm platform (macOS, Linux)

Thêm job mới trong `release.yml`:
```yaml
build-creator-macos:
  needs: ci
  runs-on: macos-latest
  # ... same steps, thêm darwin-x86_64 / darwin-aarch64 vào manifest
```
