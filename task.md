# Progress Tracker - QuizForge (Creator + Player)

## Project Overview
QuizForge is a professional quiz creation and delivery system.
- **Creator UI**: PowerPoint-style ribbon interface, rich question editing, media management, LAN result monitor.
- **Player Shell**: Lightweight, high-performance, secure (lockdown mode), multi-target export.

---

## Phase 1: Core Infrastructure & Single App Restructure
- [x] STEP_01 - Restructure project into a single app
- [x] STEP_02 - Implement SQLite Database Schema (sqlx + local migrations)
- [x] STEP_03 - Implement Main Layout UI (Tauri + React + Tailwind)
- [x] STEP_04 - Implement Quiz Management Logic (Dashboard Actions)
- [x] STEP_05 - Implement Student List Import/Management UI
- [x] STEP_06 - Implement Media Management & Rich Text Editor Integration
- [x] STEP_07 - Implement Question CRUD backend connection
- [x] STEP_08 - Implement Question List Reordering UI (Drag & Drop)
- [x] STEP_09 - Implement Quiz Preview/Play logic

---

## Phase 2: Question Editors (Aesthetics & Logic)

### Question Types Matrix
| Type | ID | Editor (D1) | Engine (R1) | Player (P1) | Logic (L1) | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| True/False | `true_false` | [x] | [x] | [x] | [x] | DONE |
| Multiple Choice | `multiple_choice` | [x] | [x] | [x] | [x] | DONE |
| Multiple Response | `multiple_response` | [x] | [x] | [x] | [x] | DONE |
| Fill in the Blank | `fill_in_blank` | [x] | [x] | [x] | [x] | DONE |
| Matching | `matching` | [x] | [x] | [x] | [x] | DONE |
| Sequence | `sequence` | [x] | [x] | [x] | [x] | DONE |
| Word Bank | `word_bank` | [x] | [x] | [x] | [x] | DONE |
| Click Map | `click_map` | [x] | [x] | [x] | [x] | DONE |
| Short Essay | `short_essay` | [x] | [x] | [x] | [x] | DONE |
| Blank Infopage | `blank_page` | [x] | [x] | [x] | [x] | DONE |

---

## Phase 3: Advanced Features & Logic

- [x] IMPLEMENT_D2: Student List Dialog
  - [x] Create/Edit/Delete student entries
  - [x] Import from Excel/CSV (SheetJS)
  - [x] Export to Excel template
- [x] IMPLEMENT_D3: Quiz Properties Dialog
  - [x] General information, settings, result messages, security
- [x] IMPLEMENT_D4: Branding Dialog
  - [x] White-labeling options, logo upload, custom themes
- [x] IMPLEMENT_ED1: Question Editor Flow
  - [x] Rich text editor integration
  - [x] Media upload support (Images)
  - [x] Type-specific editors (MC, TF, FB, etc.)
- [x] IMPLEMENT_RE1: Question Reordering
  - [x] Drag & drop using @dnd-kit
  - [x] Persistent order index updates
- [x] IMPLEMENT_PR1: Live Preview System

---

## Phase 4: Export & Bundling

### STEP_13B: .qfz Export/Import
- [x] Export .qfz (ZIP archive):
  - [x] `manifest.json`: version, schema, quizId, exportedAt, mediaCount, questionCount
  - [x] `quiz.json`: metadata + settings (no questions)
  - [x] `questions.json`: all questions (no media blobs)
- [x] `students.json`: student list (optional)
- [x] `theme.json`: player template
- [x] `media/`: img_<uuid>.webp, audio_<uuid>.mp3, video_<uuid>.mp4
- [x] Import .qfz → parse + insert into SQLite
- [ ] Version migration if schema mismatch

### STEP_18: Player Bundle Export
- [x] Export pipeline (Rust):
  1. [x] quiz.dat creation:
     - [x] Split: display_json (no answers) + answers_json (encrypted)
     - [x] Encrypt answers_json: AES-256-GCM
     - [x] Key: PBKDF2-SHA256(quiz_id + timestamp, random_salt, 100000 iterations)
     - [x] Format: [salt 16B][nonce 12B][encrypted_answers][display_json_b64]
  2. [x] students.dat: encrypt full student list
  3. [ ] Bundle: player.exe + quiz.dat + students.dat + webview2_bootstrapper.exe
  4. [ ] 7-Zip SFX or NSIS packaging → final .exe
  5. [ ] Cleanup temp dir
- [ ] WebView2 strategy:
  - [ ] Registry check for existing WebView2
  - [ ] Bootstrapper (2MB) for online mode
  - [ ] Fixed Runtime (~150MB) for offline mode

---

## Phase 5: Networking & Security

### STEP_19: LAN Receiver in Creator
- [x] Axum HTTP server port (configurable)
- [x] Tokio async: handle concurrent connections
- [x] mDNS advertisement: _quizforge._tcp.local
- [x] Each result: emit event to React UI
- [x] Real-time monitor data updates (Save to SQL) ← fixed SESSION 003

### STEP_20: Auto-Updater
- [ ] tauri-plugin-updater setup
- [ ] Background check on startup (async, no UI block)
- [ ] Toast: "Có phiên bản mới X.Y.Z [Xem chi tiết] [Cập nhật ngay] [Để sau]"
- [ ] Background download → "Tải xong. Khởi động lại? [Ngay] [Để sau]"
- [ ] ed25519 signature verification
- [ ] Timeout 10s, fail silently

### STEP_21: Security Hardening

#### Player Security
- [ ] Named Mutex: "Global\QuizForge_Player_\<quiz_id>"
- [ ] Disable DevTools: F12, Ctrl+Shift+I, Ctrl+U
- [ ] Disable right-click context menu
- [ ] Lockdown Mode (B2):
  - [ ] `window.set_fullscreen(true)`, `set_always_on_top(true)`, `set_decorations(false)`
  - [ ] System hotkey hooks (Windows API): Alt+F4, Alt+Tab, Win, Ctrl+Esc, Win+D, Win+L, Win+M
  - [ ] Override close event → prevent + log + send to Creator
  - [ ] Ctrl+Alt+Del: can't block, but log tab-out
- [ ] Tab-out detection (always active):
  - [ ] Windows `SetWinEventHook` for focus loss
  - [ ] Log timestamp + count
  - [ ] Send tab_out_event via TCP 41236 immediately

---

## Phase 6: Testing & CI/CD

### STEP_22: Tests
- [ ] Unit tests (Vitest):
  - [ ] All Zod schema validation
  - [ ] Quiz engine scoring logic (all 10 types)
  - [ ] Utility functions
- [ ] Integration tests (Tauri + Vitest):
  - [ ] Tauri commands with real SQLite
  - [ ] File export/import round-trip .qfz
- [ ] E2E tests (Playwright):
  - [ ] Create quiz → add questions → export player
  - [ ] Import .qfz → verify data integrity
  - [ ] Player: complete quiz → verify result
- [ ] Manual test checklist (Windows 10):
  - [ ] Creator installs correctly
  - [ ] SQLite DB at %APPDATA%\QuizForge\
  - [ ] All 10 question types work
  - [ ] Student Excel import
  - [ ] .qfz export/import round-trip
  - [ ] Player .exe export + runs standalone
  - [ ] Named Mutex prevents double-open
  - [ ] DevTools disabled, right-click disabled
  - [ ] All keyboard shortcuts
  - [ ] Timer countdown
  - [ ] LAN discovery + result submission
  - [ ] HTTP result submission
  - [ ] Auto-update detection
  - [ ] RAM < 150MB Creator, < 80MB Player

### STEP_23: CI/CD
- [ ] `.github/workflows/build-creator.yml`:
  - [ ] Windows runner, pnpm, rust toolchain
  - [ ] Build + tauri-action
  - [ ] Upload to GitHub Release
  - [ ] TAURI_PRIVATE_KEY + TAURI_KEY_PASSWORD secrets
- [ ] `.github/workflows/build-player.yml`
- [ ] `.github/workflows/release.yml`
- [ ] Update server endpoint format

---

## Cross-cutting Concerns

### UX Edge Cases (E3) — must handle
#### Creator
- [ ] Import old .qfz → migration + "Đã nâng cấp định dạng"
- [ ] Import corrupt .qfz → clear error, no crash
- [ ] Delete media in use → block + "Đang dùng bởi câu X, Y"
- [ ] Close during export → cancel + cleanup temp
- [ ] Export 0-question quiz → "Cần ít nhất 1 câu"
- [ ] Question without correct answer → block save
- [ ] "Áp dụng cho tất cả" → confirmation dialog
- [ ] Duplicate student names → warning, not blocking, show "(1)" "(2)"
- [ ] Monitor without quiz open → still receive by quiz_id
- [ ] Slow internet → update timeout 10s, fail silently

#### Player
- [ ] Submit without selection → "Bạn chưa chọn. Nộp trống?"
- [ ] Timer expires → auto-submit all remaining (blank)
- [ ] Close before submission → "Kết quả chưa gửi. Thoát?"
- [ ] Word Bank: drag to occupied slot → swap
- [ ] Click Map: click outside hotspot → ignore
- [ ] Network loss → auto fallback LAN → local file
- [ ] Ctrl+Alt+Del in Lockdown → log only
- [ ] Screen < 800px width → scroll, no layout break
- [ ] Media error → placeholder, no crash
- [ ] Lockdown + power loss → resume at current question
