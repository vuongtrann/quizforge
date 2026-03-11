# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QuizForge** — A desktop quiz creation and examination platform built with Tauri v2 + React + Rust. Two separate Tauri apps share workspace packages.

## Monorepo Structure

- **`apps/creator`** — Quiz authoring desktop app (Teacher-facing). Full-featured editor with SQLite database, TipTap rich text, DnD-Kit sorting, TanStack Router/Query/Table, Recharts for results, and a LAN server for receiving exam submissions.
- **`apps/player`** — Quiz player desktop app (Student-facing). Loads a `quiz.dat` bundle (AES-256-GCM encrypted answers), submits results over LAN via mDNS discovery.
- **`packages/types`** — Shared Zod schemas + TypeScript types (`@quizforge/types`). Single source of truth for all data structures.
- **`packages/quiz-engine`** — Shared scoring/validation logic (`@quizforge/quiz-engine`). Depends on `@quizforge/types`.
- **`packages/ui`** — Shared React component library (`@quizforge/ui`).

## Commands

All commands run from the monorepo root using **pnpm** and **Turborepo**.

```bash
# Install dependencies
pnpm install

# Dev (both apps in parallel)
pnpm dev

# Build all
pnpm build

# Type check
pnpm typecheck

# Run tests (vitest, packages only)
pnpm test

# Run tests for a single package
cd packages/types && pnpm test
cd packages/quiz-engine && pnpm test

# Lint
pnpm lint

# Run Tauri dev for a specific app
cd apps/creator && pnpm tauri dev
cd apps/player && pnpm tauri dev

# Build Tauri app
cd apps/creator && pnpm tauri build
cd apps/player && pnpm tauri build
```

## Architecture

### Creator App (`apps/creator`)

**Frontend (React/TypeScript):**
- `src/router.tsx` — TanStack Router config. Routes: `/` (Welcome), `/dashboard`, `/quiz/$quizId` (editor), `/preview/$quizId`, `/settings`, `/receive`
- `src/store/appStore.ts` — Zustand store for global UI state (current view, dialogs, editor state)
- `src/pages/` — One file per route (WelcomeScreen, Dashboard, QuizEditor, PlayerPage, Settings, ReceiveMode)
- `src/components/` — Feature components
- `src/hooks/` — Custom hooks
- `src/lib/` — Utilities

**Backend (Rust/Tauri):**
- `src-tauri/src/database/mod.rs` — SQLite via `sqlx`. Schema is inline (no migrations runner). Tables: `quizzes`, `questions`, `media_files`, `student_lists`, `quiz_student_lists`, `students`, `quiz_results`, `app_settings`
- `src-tauri/src/commands/` — Tauri command handlers split by domain: `quiz_commands`, `question_commands`, `student_commands`, `export_commands`, `network_commands`
- `src-tauri/src/network/server.rs` — LAN HTTP server to receive player submissions
- `src-tauri/src/models/` — Rust model structs

**Key flows:**
- Quiz data is stored in SQLite with JSON columns for complex nested data (settings, theme, type-specific question data)
- `export_commands::prepare_player_bundle` splits quiz into display data + AES-256-GCM encrypted answers → writes `quiz.dat` and `students.dat` files for the Player app
- `export_commands::export_quiz_to_qfz` / `import_quiz_from_qfz` — `.qfz` format is a ZIP with `manifest.json` + `quiz.json`

### Player App (`apps/player`)

**Frontend (React/TypeScript):**
- `src/App.tsx` — Entry point
- `src/store/playerStore.ts` — Zustand + Immer store. Phases: `intro → quiz → reviewing → result`
- `src/components/` — Quiz UI components
- `src/renderers/` — Question type renderers

**Backend (Rust/Tauri):**
- `src-tauri/src/commands/quiz_loader.rs` — Loads `quiz.dat`/`students.dat` from disk
- `src-tauri/src/commands/network.rs` — mDNS discovery (`_quizforge._tcp.local.`) + HTTP result submission
- `src-tauri/src/commands/validate.rs` — Answer validation (decrypts answers from bundle)
- `src-tauri/src/security/` — Anti-cheat / lockdown features; DevTools disabled in production builds

### Shared Packages

- **`@quizforge/types`** — All Zod schemas. Key types: `Quiz`, `Question` (union of 10+ question types), `QuizResult`, `ValidationResult`, `StudentList`, `QfzManifest`. Import directly from source (no build step needed in workspace).
- **`@quizforge/quiz-engine`** — `scoring.ts`, `validation.ts`. Used by creator for preview and by packages; Player uses Tauri-side Rust validation.
- **`@quizforge/ui`** — Shared components using CVA + tailwind-merge + lucide-react.

### LAN Exam Flow

1. Creator exports Player Bundle (`quiz.dat` + `students.dat`) to a directory.
2. Student opens Player app, loads the bundle.
3. Player discovers Creator's LAN server via mDNS.
4. On completion, Player POSTs result JSON to Creator's HTTP server.
5. Creator receives result, stores in `quiz_results` table, shows in Monitor tab.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Tauri v2 |
| Frontend | React 19, TypeScript 5.8 |
| Routing | TanStack Router v1 |
| Server state | TanStack Query v5 |
| Client state | Zustand v4 + Immer |
| Styling | Tailwind CSS v3, CVA, tailwind-merge |
| Rich text | TipTap v2 |
| DnD | @dnd-kit |
| Tables/Charts | TanStack Table, Recharts |
| Forms | TanStack Form |
| Schema/Validation | Zod v3 (packages/creator), Zod v4 (player) |
| Backend language | Rust |
| DB | SQLite via sqlx |
| Encryption | AES-256-GCM (aes-gcm crate), PBKDF2-SHA256 |
| LAN discovery | mDNS-SD |
| Build | Vite 7, pnpm workspaces, Turborepo |
| Testing | Vitest (packages only) |
