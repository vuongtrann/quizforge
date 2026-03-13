# QuizForge — AI Agent Execution Plan
> **Version**: 3.0 | **Audience**: AI Coding Agent  
> **Read this entire file before writing any code.**  
> **Rule #1**: Player.exe is the primary target. Every UI decision starts from Desktop, then adapts for Web.

---

## 0. Context & Constraints

### What already exists
```
packages/types        → Zod schemas for Quiz, Question, Result (10 question types)
packages/quiz-engine  → Scoring logic, timer, partial scoring
packages/ui           → shadcn/ui primitives (Button, Input, Card...)
apps/creator          → Tauri 2 desktop app (React + Rust/SQLite)
apps/player           → Minimal shell for exam delivery
apps/web              → Next.js 15 App Router skeleton
```

### What does NOT exist yet (your job)
```
packages/quiz-player-ui   → THE most important new package (see Section 2)
Aiven PostgreSQL schema    → Migration files via Prisma
Aiven Redis integration    → Queue for submit jobs
apps/web API routes        → /api/quiz/publish, /api/quiz/[slug], /api/submit, /api/result/[id]
apps/web player route      → /u/[userId]/[slug]
Tauri publish_to_web cmd   → Rust command + React UI
```

### Hard rules — never violate
1. **pnpm only** — no npm, no yarn
2. **No `any` in TypeScript** — define Zod schema first, derive type
3. **answers never reach client** — `answersHash` stays in DB and server memory only
4. **quiz-player-ui is platform-agnostic** — no `invoke()`, no `fetch()` inside the package
5. **Windows-first sizing** — design at 1024×768, then responsive to 375px
6. **Font must be bundled** — Geist font in Tauri assets AND self-hosted in web/public/fonts/
7. **Aiven pgBouncer port** — DATABASE_URL must use port 6543, add `connection_limit=1` to Prisma URL

---

## 1. Sprint 0 — Foundation Setup
**Duration**: 1 week  
**Goal**: Everything compiles, connects, zero features yet.

### 1.1 Aiven Setup
```bash
# After creating Aiven PostgreSQL (Singapore region, Startup plan):
# pgBouncer connection string format:
DATABASE_URL="postgresql://user:pass@host:6543/db?sslmode=require&pgbouncer=true&connection_limit=1"
# Direct connection (for migrations only):
DIRECT_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# After creating Aiven Redis:
REDIS_URL="rediss://user:pass@host:port"
```

Prisma schema must use both URLs:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // pgBouncer port 6543
  directUrl = env("DIRECT_URL")        // direct port 5432 for migrations
}
```

### 1.2 Vercel Project
```bash
# In apps/web:
vercel link
# Set environment variables:
# DATABASE_URL, DIRECT_URL, REDIS_URL
# NEXTAUTH_SECRET, NEXTAUTH_URL
# BLOB_READ_WRITE_TOKEN (from Vercel Blob setup)
```

### 1.3 packages/quiz-player-ui — Scaffold
```bash
mkdir -p packages/quiz-player-ui/src/{tokens,components/{shell,questions,timer,lockdown,result},hooks,types}

# package.json
{
  "name": "@quizforge/quiz-player-ui",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "dependencies": {
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^7.0.0",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "react": ">=18"
  }
}
```

### 1.4 Design Tokens — Single source of truth
```typescript
// packages/quiz-player-ui/src/tokens/colors.ts
export const tokens = {
  // Neutral scale (Vercel-like)
  'gray-950':  '#111111',  // Primary text, primary button bg
  'gray-700':  '#374151',  // Secondary text, option label
  'gray-500':  '#6b7280',  // Tertiary text, placeholder, meta
  'gray-400':  '#9ca3af',  // Section labels (uppercase)
  'gray-300':  '#d1d5db',  // Hover border
  'gray-200':  '#e5e7eb',  // Default border (0.5px)
  'gray-100':  '#f3f4f6',  // Badge bg, key hint bg
  'gray-50':   '#f9fafb',  // Hover surface
  'page-bg':   '#fafafa',  // App/page background

  // Accent — interactive elements ONLY
  'blue-700':  '#1d4ed8',  // Selected text
  'blue-500':  '#3b82f6',  // Selected border, focus, link
  'blue-100':  '#dbeafe',  // Key hint selected bg
  'blue-50':   '#eff6ff',  // Selected option background

  // Semantic — appear ONLY after quiz submit
  'green-700': '#15803d',  'green-500': '#22c55e',  'green-50': '#f0fdf4',
  'red-700':   '#b91c1c',  'red-500':   '#ef4444',  'red-50':   '#fef2f2',

  // Warning — timer only
  'amber-700': '#b45309',  'amber-500': '#f59e0b',  'amber-50': '#fffbeb',
} as const;
```

### 1.5 Geist Font — Bundle for both targets
```bash
# Download Geist from https://vercel.com/font
# Save to:
apps/creator/src-tauri/assets/fonts/Geist-Regular.woff2
apps/creator/src-tauri/assets/fonts/Geist-Medium.woff2
apps/creator/src-tauri/assets/fonts/Geist-SemiBold.woff2
apps/web/public/fonts/Geist-Regular.woff2
apps/web/public/fonts/Geist-Medium.woff2
apps/web/public/fonts/Geist-SemiBold.woff2
```

### 1.6 Prisma Schema — Initial migration
```prisma
// apps/web/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum AuthMode {
  ANONYMOUS
  REQUIRE_LOGIN
  ACCESS_CODE
}

enum LockdownLevel {
  NONE
  SOFT
  STRICT
}

model User {
  id            String          @id @default(cuid())
  email         String          @unique
  name          String?
  image         String?
  publishedQuiz PublishedQuiz[]
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime        @default(now())
}

model PublishedQuiz {
  id             String        @id @default(cuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id])
  slug           String        @unique
  title          String
  description    String?
  authMode       AuthMode      @default(ANONYMOUS)
  accessCode     String?
  lockdownLevel  LockdownLevel @default(SOFT)
  maxTabOuts     Int           @default(3)
  timeLimit      Int?
  openAt         DateTime?
  closeAt        DateTime?
  isActive       Boolean       @default(true)
  questionsJson  Json
  answersHash    String
  mediaBaseUrl   String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  results        QuizResult[]

  @@index([userId])
}

model QuizResult {
  id            String        @id @default(cuid())
  quizId        String
  quiz          PublishedQuiz @relation(fields: [quizId], references: [id])
  studentId     String?
  studentName   String?
  score         Float
  maxScore      Float
  percentage    Float
  answersJson   Json
  tabOutCount   Int           @default(0)
  tabOutEvents  Json          @default("[]")
  wasForced     Boolean       @default(false)
  startedAt     DateTime
  submittedAt   DateTime      @default(now())

  @@index([quizId])
  @@index([studentId])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

```bash
cd apps/web
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### Sprint 0 Checklist
- [ ] Aiven PostgreSQL connected, migration applied
- [ ] Aiven Redis connected, `REDIS_URL` in Vercel env
- [ ] Vercel project linked, env vars set
- [ ] `packages/quiz-player-ui` compiles (even if empty)
- [ ] Design tokens defined in `tokens/`
- [ ] Geist font bundled in both Tauri assets and `web/public/fonts/`
- [ ] `pnpm build` passes from root (no type errors)

---

## 2. Sprint 1 — packages/quiz-player-ui Core
**Duration**: 2 weeks  
**Goal**: WebPlayerShell + 4 question types working identically in Windows WebView2 AND Chrome.

### 2.1 Types — Add to packages/types

```typescript
// packages/types/src/player.ts
import { z } from 'zod';

export const LockdownConfigSchema = z.object({
  level: z.enum(['NONE', 'SOFT', 'STRICT']),
  maxTabOuts: z.number().int().min(1).default(3),
  warnOnTabOut: z.boolean().default(true),
});

export const PlayerConfigSchema = z.object({
  quiz: QuizDisplayDataSchema,
  lockdown: LockdownConfigSchema,
  timeLimit: z.number().int().positive().optional(),
  allowNavigation: z.boolean().default(true),
  showFeedback: z.enum(['immediate', 'after_submit', 'never']).default('after_submit'),
  locale: z.enum(['vi', 'en']).default('vi'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
});

export type PlayerConfig = z.infer<typeof PlayerConfigSchema>;
export type LockdownConfig = z.infer<typeof LockdownConfigSchema>;
```

### 2.2 Session State Machine

```typescript
// packages/quiz-player-ui/src/hooks/useQuizSession.ts
type SessionStatus = 'idle' | 'active' | 'paused' | 'submitting' | 'completed' | 'error';

interface SessionState {
  status: SessionStatus;
  currentIndex: number;
  answers: Record<string, string[]>;
  tabOutEvents: TabOutEvent[];
  startedAt: number | null;
  result: SubmitResult | null;
  error: string | null;
}
```

### 2.3 WebPlayerShell — Layout structure

```
┌─────────────────────────────────────────────┐
│  HEADER (56px, sticky, white)               │
│  [Timer pill]  [Quiz Title]   [3 / 10]      │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  ← 2px blue bar    │
├─────────────────────────────────────────────┤
│  CONTENT (flex-grow, bg: #fafafa)           │
│                                             │
│    ┌──────────────────────────────────┐     │
│    │  câu 3              [10 điểm]    │     │
│    │  Question text here...           │     │
│    │                                  │     │
│    │  ○  Option A                     │     │
│    │  ●  Option B  ← selected         │     │
│    │  ○  Option C                     │     │
│    └──────────────────────────────────┘     │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER (68px, white, border-top 0.5px)     │
│  ● ● ◉ ○ ○ ○    [← Trước]  [Tiếp →]       │
└─────────────────────────────────────────────┘
```

CSS variables on shell root (platform switch without code change):
```typescript
// Desktop: '--option-height':'48px', '--content-padding':'32px', '--show-key-hints':'1'
// Web:     '--option-height':'52px', '--content-padding':'20px', '--show-key-hints':'0'
```

---

## 3. Sprint 2 — Creator App Redesign
**Duration**: 2 weeks  
**Goal**: Replace current ribbon/modal UI with clean 3-panel layout.

> See Section 11 (UI/UX Design System) for detailed specs before writing any JSX.

---

## 4. Sprint 3 — Web Publishing
**Duration**: 2 weeks  
**Goal**: Teacher publishes quiz → student gets URL → submits → result saved.

### 4.1 API Routes

```
POST /api/quiz/publish      → create PublishedQuiz, return slug
GET  /api/quiz/[slug]       → return questionsJson (NO answers)
POST /api/submit            → score answers server-side, save QuizResult
GET  /api/result/[id]       → return SubmitResult for student
```

### 4.2 Web Player Route

```
/u/[userId]/[slug]          → loads PublishedQuiz, renders WebPlayerShell
```

---

## 5. Sprint 4 — Hardening
**Duration**: 1 week  
**Goal**: Security, performance, edge cases.

- [ ] Rate limiting on `/api/submit` (10 req/min per IP)
- [ ] Answer hash verification (AES-256-GCM)
- [ ] Lockdown STRICT: auto-submit after maxTabOuts
- [ ] Timer sync: server timestamp, not client Date.now()
- [ ] Redis queue for submit jobs (prevent duplicate submissions)

---

## 6. Checklist — Before Any Sprint Merge

- [ ] `pnpm build` from root passes (no type errors)
- [ ] `pnpm test` passes
- [ ] No `console.log` left in production code
- [ ] No API keys or secrets in code (only `process.env.*`)
- [ ] Response time < 200ms for GET routes
- [ ] Handles Aiven connection errors gracefully

---

## 11. UI / UX Design System — Mandatory Reference

> **Agent instruction**: Before writing any JSX/TSX/CSS, read this entire section. Every pixel decision is specified here. Do not deviate without explicit instruction.

---

### 11.0 Design Vision & Platform Strategy

**Mục tiêu**: Simple, clean, modern. Giáo viên và học sinh nhìn vào là muốn dùng. Không màu mè, không rối mắt.

**Cảm hứng**: Vercel dashboard, Linear app — neutral-first, information-dense without clutter.

**Nguyên tắc màu sắc**: Color only appears when it carries meaning. Never for decoration.

**Hai nền tảng, một ngôn ngữ thiết kế:**

| Yếu tố | Desktop (Creator + Player.exe) | Web (Next.js) |
|--------|-------------------------------|---------------|
| Layout | 3-panel, fixed window | Centered content, max-width 900px |
| Font size base | 14px | 15px |
| Touch targets | 36-44px height | 44-52px height |
| Key hints (A/B/C/D) | Hiện | Ẩn |
| Border radius | 6–8px | 8–10px |
| Padding | Compact (16–24px) | Spacious (20–32px) |
| Scrollbar | Styled thin (4px) | Browser default |
| Animation | Tắt mặc định | Nhẹ, 150ms |
| Navigation | Left sidebar | Top nav + sidebar |

**Vấn đề với UI hiện tại (phải sửa hết):**
- ❌ Modal editor popup → thay bằng panel edit inline trong 3-panel layout
- ❌ Mint green (#2ecc9c) selected state → thay bằng blue-500 system-wide
- ❌ Ribbon toolbar kiểu MS Office → thay bằng topbar tối giản
- ❌ ALL CAPS bold section headers → small gray uppercase tracking labels
- ❌ Thick 1px dark borders → 0.5px `#e5e7eb`
- ❌ Question type list trong left panel của editor → chuyển thành "+ Thêm câu hỏi" dropdown

---

### 11.1 Color Tokens — Duy nhất, không ngoại lệ

```typescript
// packages/quiz-player-ui/src/tokens/colors.ts
export const tokens = {
  // Neutral scale (Vercel-like)
  'gray-950':  '#111111',  // Primary text, primary button bg
  'gray-700':  '#374151',  // Secondary text, option label
  'gray-500':  '#6b7280',  // Tertiary text, placeholder, meta
  'gray-400':  '#9ca3af',  // Section labels (uppercase)
  'gray-300':  '#d1d5db',  // Hover border
  'gray-200':  '#e5e7eb',  // Default border (0.5px)
  'gray-100':  '#f3f4f6',  // Badge bg, key hint bg
  'gray-50':   '#f9fafb',  // Hover surface
  'page-bg':   '#fafafa',  // App/page background

  // Accent — interactive elements ONLY
  'blue-700':  '#1d4ed8',  // Selected text
  'blue-500':  '#3b82f6',  // Selected border, focus, link, active nav
  'blue-100':  '#dbeafe',  // Key hint selected bg
  'blue-50':   '#eff6ff',  // Selected option background

  // Semantic — appear ONLY after quiz submit
  'green-700': '#15803d',  'green-500': '#22c55e',  'green-50': '#f0fdf4',
  'red-700':   '#b91c1c',  'red-500':   '#ef4444',  'red-50':   '#fef2f2',

  // Warning — timer only
  'amber-700': '#b45309',  'amber-500': '#f59e0b',  'amber-50': '#fffbeb',
} as const;
```

---

### 11.2 Typography

```typescript
export const font = {
  family:     "'Geist', system-ui, -apple-system, sans-serif",
  familyMono: "'Geist Mono', 'Courier New', monospace",
} as const;

export const textStyles = {
  quizTitle:    { fontSize: '24px', fontWeight: 500 },
  questionText: { fontSize: '16px', fontWeight: 500, lineHeight: 1.6 },
  optionLabel:  { fontSize: '14px', fontWeight: 500 },
  sectionLabel: { fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const },
  body:         { fontSize: '14px', fontWeight: 400 },
  caption:      { fontSize: '12px', fontWeight: 400 },
  timer:        { fontSize: '20px', fontWeight: 500, fontFamily: "'Geist Mono', monospace" },
  keyHint:      { fontSize: '11px', fontWeight: 500, fontFamily: "'Geist Mono', monospace" },
} as const;
// FORBIDDEN: fontSize below 12px. fontWeight 600 or 700.
```

---

### 11.3 Spacing & Borders

```typescript
export const radius = {
  sm: '6px',    // badges, key hints, tags
  md: '8px',    // option buttons, inputs, cards (desktop)
  lg: '10px',   // cards, modals (web)
  pill: '999px',
} as const;

export const border = {
  default:  '0.5px solid #e5e7eb',
  hover:    '0.5px solid #d1d5db',
  selected: '1.5px solid #3b82f6',
  correct:  '1.5px solid #22c55e',
  wrong:    '1.5px solid #ef4444',
} as const;
// FORBIDDEN: 1px borders. box-shadow for depth.
// Focus ring only: box-shadow: 0 0 0 3px rgba(59,130,246,0.15)
```

---

### 11.4 Creator App — 3-Panel Layout (Desktop)

#### Màn hình Home (apps/creator — trang chủ)

```
┌─────────────────────────────────────────────────────────────────┐
│  Title bar (44px, draggable)                                    │
│  [Q]  QuizForge Creator                           [─ □ ✕]      │
├──────────────────┬──────────────────────────────────────────────┤
│  Left nav        │  Content area                               │
│  (220px)         │                                             │
│                  │  Gần đây                                    │
│  TẠO MỚI        │  ─────────────────────────────              │
│  + Quiz mới      │  [Chưa có quiz nào]                         │
│  ↑ Từ Word       │  Tạo quiz đầu tiên của bạn →               │
│  ↑ Từ Excel      │                                             │
│                  │                                             │
│  MỞ             │                                             │
│  ⊞ Dashboard     │                                             │
│  ↓ Import .qfz   │                                             │
│                  │                                             │
│  CÔNG CỤ        │                                             │
│  ◎ Receive Mode  │                                             │
│  ⚙ Thiết lập     │                                             │
│                  │                                             │
│  ─────────────── │                                             │
│  Cộng đồng       │                                             │
│  Xem mẫu         │                                             │
│  Hỗ trợ          │                                             │
└──────────────────┴─────────────────────────────────────────────┘
```

**Left nav spec:**
- Width: 220px, fixed, bg: white, border-right: 0.5px #e5e7eb
- Section labels: 11px, uppercase, color: #9ca3af, letter-spacing: 0.06em, margin-top: 20px
- Nav items: 14px, color: #374151, padding: 6px 12px, border-radius: 6px
- Nav item hover: bg #f9fafb
- Nav item active: bg #eff6ff, color: #1d4ed8
- Bottom links (Cộng đồng, Xem mẫu, Hỗ trợ): 13px, color: #6b7280, padding: 4px 12px

#### Màn hình Editor (apps/creator — soạn quiz)

```
┌─────────────────────────────────────────────────────────────────┐
│  Title bar (44px)                                               │
│  [←]  [quiz-title-editable]     Đã lưu ✓      [─ □ ✕]        │
├──────────────────────────────────────────────────────────────────│
│  Toolbar (40px, border-bottom 0.5px #e5e7eb)                   │
│  [+ Thêm câu hỏi ▾]  [Import Word]  [Xem trước]  [Xuất bản]   │
├──────────────────┬──────────────────────────────────────────────┤
│  Question list   │  Edit panel                                  │
│  (240px)         │                                             │
│                  │  câu 1  ·  Đúng/Sai  ·  [10đ]  [30s]      │
│  [T/F]  Câu 1  ● │  ──────────────────────────────────────     │
│  [MCQ]  Câu 2  ○ │                                             │
│  [MCQ]  Câu 3  ● │  Nội dung câu hỏi                          │
│  [FIB]  Câu 4  ○ │  ┌─────────────────────────────────────┐   │
│  [SEQ]  Câu 5  ● │  │ Nhập câu hỏi ở đây...               │   │
│                  │  └─────────────────────────────────────┘   │
│  ─────────────── │                                             │
│  5 câu · 50đ    │  đáp án                                     │
│                  │  ● ĐÚNG        ○ SAI                       │
│                  │                                             │
│                  │  phản hồi                                   │
│                  │  Trả lời đúng: Chính xác! [10đ]            │
│                  │  Trả lời sai:  Chưa đúng. [0đ]             │
│                  │                                             │
│                  │  ─────────────────────────────────────     │
│                  │  [← Câu trước]          [Câu tiếp →]       │
└──────────────────┴─────────────────────────────────────────────┘
│  Status bar (28px): 5 câu · 50 điểm · Passing: 95%            │
└─────────────────────────────────────────────────────────────────┘
```

**Question list panel spec (left, 240px):**
- Bg: white, border-right: 0.5px #e5e7eb
- Question item: 44px tall, padding: 8px 12px, flex row
- Question item hover: bg #f9fafb
- Question item active (current): bg #eff6ff, border-left: 2px solid #3b82f6
- Type badge: 28×20px, font: 11px mono, bg #f3f4f6, border-radius: 4px (e.g. "T/F", "MCQ")
- Answered indicator: 6px circle, right side (● = has content, ○ = empty)

**Toolbar spec (40px):**
- Bg: white, border-bottom: 0.5px #e5e7eb, padding: 0 16px
- "+ Thêm câu hỏi" → primary button, bg #111111, text white, height 30px, border-radius 6px
- Other actions: ghost buttons, 13px, color #374151, hover bg #f9fafb

**"+ Thêm câu hỏi" dropdown menu:**
```
┌────────────────────────────────────┐
│  Loại câu hỏi                      │
│  ────────────────────────────────  │
│  ✓  Đúng / Sai                     │
│  ◉  Một đáp án (Multiple Choice)   │
│  ☑  Nhiều đáp án                   │
│  _  Điền vào chỗ trống             │
│  ↔  Nối cột (Matching)             │
│  ≡  Sắp xếp (Sequence)             │
│  □  Ngân hàng từ (Word Bank)       │
│  ⊙  Click vào ảnh (Click Map)      │
│  ✎  Tự luận ngắn                   │
│  📄 Trang trống (Blank Page)        │
└────────────────────────────────────┘
```

**Edit panel spec:**
- Bg: #fafafa, padding: 24px 32px
- Question meta row: "câu 1 · Đúng/Sai · [10đ] [30s]" — all 3 are inline-editable on click
- Section labels: 11px uppercase #9ca3af (e.g. "đáp án", "phản hồi")
- Question textarea: auto-height, no border (just bottom border 0.5px on focus), 16px, weight 500
- Auto-save: debounced 800ms → "Đã lưu ✓" in title bar (NOT toast)
- No OK/Cancel buttons anywhere

**Title bar quiz name:**
- Click to edit inline — turns into input, 16px, weight 500
- Placeholder: "Tên quiz..."
- On blur/Enter: saves, shows "Đã lưu ✓"

---

### 11.5 Web App Layout (apps/web — Next.js)

#### Dashboard (giáo viên đã đăng nhập)

```
┌─────────────────────────────────────────────────────────────────┐
│  Top nav (56px, white, border-bottom 0.5px #e5e7eb, sticky)    │
│  [Q] QuizForge          Quiz của tôi · Mẫu · Kết quả          │
│                                    [Tạo quiz ▾]  [Avatar]      │
├─────────────────────────────────────────────────────────────────┤
│  Content (max-width: 960px, margin: auto, padding: 32px 24px)  │
│                                                                 │
│  Quiz của tôi                        [+ Tạo quiz mới]          │
│  ─────────────────────────────────────────────────────         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Quiz title    │  │ Quiz title    │  │ Quiz title    │       │
│  │ 10 câu · MCQ  │  │ 5 câu · T/F   │  │ 8 câu · Mix   │       │
│  │ 24 lượt làm  │  │ 12 lượt làm  │  │ 3 lượt làm   │       │
│  │ ─────────    │  │ ─────────    │  │ ─────────    │       │
│  │ [Sửa] [Share]│  │ [Sửa] [Share]│  │ [Sửa] [Share]│       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Quiz card spec:**
- Bg: white, border: 0.5px #e5e7eb, border-radius: 10px, padding: 16px
- Hover: border-color #d1d5db, subtle translateY(-1px) transition 150ms
- Title: 15px, weight 500, color #111111
- Meta: 13px, color #6b7280
- Buttons: "Sửa" (ghost), "Share" (ghost blue)

#### Web Player (học sinh làm bài)

```
┌─────────────────────────────────────────────────────────────────┐
│  Nav (56px, white, border-bottom 0.5px)                        │
│  [Q] QuizForge     [Quiz Title — truncated]     [05:30 ⏱]     │
│  ████████████████░░░░░░░░░░  ← progress bar 2px blue          │
├─────────────────────────────────────────────────────────────────┤
│  Content (bg: #fafafa, flex-grow)                              │
│                                                                 │
│         ┌──────────────────────────────────────────┐           │
│         │  câu 3 / 10                    10 điểm   │           │
│         │                                          │           │
│         │  Câu hỏi được hiển thị ở đây với font    │           │
│         │  size 16px weight 500...                 │           │
│         │                                          │           │
│         │  ○  Đáp án A                             │           │
│         │  ●  Đáp án B   ← selected (blue bg)      │           │
│         │  ○  Đáp án C                             │           │
│         │  ○  Đáp án D                             │           │
│         └──────────────────────────────────────────┘           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Footer (68px, white, border-top 0.5px)                        │
│  ● ● ◉ ○ ○ ○ ○ ○ ○ ○        [← Trước]    [Tiếp theo →]      │
└─────────────────────────────────────────────────────────────────┘
```

---

### 11.6 Option Button — Full State Specification

```typescript
const stateStyles = {
  default:  { background: '#ffffff', border: '0.5px solid #e5e7eb', color: '#374151' },
  hover:    { background: '#f9fafb', border: '0.5px solid #d1d5db', color: '#374151' },
  selected: { background: '#eff6ff', border: '1.5px solid #3b82f6', color: '#1d4ed8' },
  correct:  { background: '#f0fdf4', border: '1.5px solid #22c55e', color: '#15803d' },
  wrong:    { background: '#fef2f2', border: '1.5px solid #ef4444', color: '#b91c1c' },
  disabled: { background: '#ffffff', border: '0.5px solid #e5e7eb', color: '#6b7280', opacity: 0.6 },
};
// Desktop height: 48px. Web height: 52px (touch-friendly).
// NEVER use <input type="radio"> — renders differently across WebView2/WebKit/Chrome.
// Key hint (A/B/C/D): 22x22px, border-radius: 5px, font-family: monospace.
// Key hint hidden on mobile (--show-key-hints: 0).
```

---

### 11.7 Timer State Colors

```typescript
function getTimerStyle(percentRemaining: number) {
  if (percentRemaining > 20)
    return { color: '#6b7280', background: '#f3f4f6', border: '0.5px solid #e5e7eb' };
  if (percentRemaining > 10)
    return { color: '#b45309', background: '#fffbeb', border: '0.5px solid #f59e0b' };
  // Critical: add CSS pulse animation, guarded by prefers-reduced-motion
  return { color: '#b91c1c', background: '#fef2f2', border: '0.5px solid #ef4444' };
}
```

---

### 11.8 Section Label Spec

```typescript
// Exact CSS — do not modify
const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#9ca3af',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '8px',
  // NO border below. NO background. Just text.
};
```

---

### 11.9 Shared Components — Behavior across both platforms

**Primary Button (e.g. "Xuất bản", "Nộp bài"):**
- bg: #111111, text: white, height: 34px desktop / 40px web
- border-radius: 6px, font: 14px weight 500
- hover: bg #374151
- disabled: opacity 0.4

**Ghost Button (secondary actions):**
- bg: transparent, text: #374151, border: 0.5px #e5e7eb
- hover: bg #f9fafb
- active/focus: border-color #3b82f6

**Input / Textarea:**
- border: 0.5px #e5e7eb, border-radius: 8px
- focus: border-color #3b82f6 + box-shadow: 0 0 0 3px rgba(59,130,246,0.12)
- placeholder: #9ca3af
- font: 14px, color: #111111

**Badge (question type, score, time):**
- bg: #f3f4f6, color: #374151
- border: 0.5px #e5e7eb, border-radius: 6px
- font: 12px, padding: 2px 8px
- hover/editable: border-color #3b82f6, cursor text

**Progress bar:**
- height: 2px, bg: #e5e7eb (track), bg: #3b82f6 (fill)
- position: bottom edge of header
- transition: width 300ms ease

**Toast / Notification:**
- Chỉ dùng cho error states và network warnings
- bg: white, border: 0.5px #e5e7eb, border-radius: 8px
- shadow: 0 4px 12px rgba(0,0,0,0.08)
- Position: bottom-right corner
- Auto-dismiss: 3s
- Success state: KHÔNG dùng toast → dùng inline "Đã lưu ✓" trong title bar

---

### 11.10 Responsive — Desktop → Web adaptation

```typescript
// CSS variable injection — caller sets these on root element
// Desktop (Tauri):
{
  '--platform': 'desktop',
  '--option-height': '48px',
  '--content-padding': '32px',
  '--show-key-hints': '1',
  '--card-radius': '8px',
  '--font-base': '14px',
}

// Web (Next.js):
{
  '--platform': 'web',
  '--option-height': '52px',
  '--content-padding': '20px',
  '--show-key-hints': '0',
  '--card-radius': '10px',
  '--font-base': '15px',
}

// Mobile web (< 768px):
{
  '--option-height': '56px',
  '--content-padding': '16px',
  '--show-key-hints': '0',
}
```

---

### 11.11 Anti-patterns — NEVER DO

```
❌ background: '#2ecc9c'          → use blue-50 selected state
❌ border: '1px solid ...'        → use 0.5px or 1.5px only
❌ background: 'linear-gradient'  → flat colors only
❌ boxShadow: '0 4px 6px ...'     → focus ring only (0 0 0 3px)
❌ <input type="radio">           → custom button always
❌ <input type="checkbox">        → custom button always
❌ fontSize: '10px'               → minimum 12px
❌ fontWeight: 700                → maximum 500
❌ animation without @media (prefers-reduced-motion: no-preference)
❌ Designing Web layout first     → always Desktop-first
❌ Modal dialogs for editing      → inline editing only
❌ Toast for save success         → "Đã lưu ✓" in title bar
❌ OK/Cancel buttons              → auto-save with debounce
❌ Loading spinners > 200ms       → skeleton placeholders
❌ fontWeight: 600 or 700         → max weight is 500
❌ color: '#2ecc9c' for anything  → never use green for interactive
```

---

### 11.12 Accessibility

- All interactive elements: `aria-label` in Vietnamese
- Focus visible: always show focus ring (0 0 0 3px rgba(59,130,246,0.15))
- Color contrast: minimum WCAG AA (4.5:1) for body text, AAA (7:1) recommended
- Keyboard navigation: Tab order follows visual order
- Screen reader: `role="status"` for save indicator, `aria-live="polite"` for timer warnings
- `prefers-reduced-motion`: wrap ALL animations in `@media (prefers-reduced-motion: no-preference)`

---

*End of AGENT_PLAN.md v3.0 — Read before writing any code.*

---

## 12. Player UI — 10 Loại Câu Hỏi — Spec Chi Tiết

> **Agent instruction**: Đây là section quan trọng nhất cho Sprint 1. Đọc hết trước khi viết bất kỳ component câu hỏi nào.

### 12.0 Kiến trúc chung — QuestionRenderer

```typescript
// packages/quiz-player-ui/src/components/questions/QuestionRenderer.tsx
// Switch dispatch — mỗi type là 1 component riêng biệt

import type { Question, QuestionType } from '@quizforge/types';

interface QuestionRendererProps {
  question: Question;
  answer: string[];                      // current answer from session state
  onAnswer: (answers: string[]) => void; // controlled — no internal state
  showResult?: boolean;                  // true = show correct/wrong after submit
  result?: QuestionResult;               // correct/wrong per choice
  platform: 'desktop' | 'web';          // injects CSS vars
}

export function QuestionRenderer({ question, answer, onAnswer, showResult, result, platform }: QuestionRendererProps) {
  const css = platform === 'desktop'
    ? { '--opt-height': '48px', '--show-key-hints': '1', '--content-pad': '32px' }
    : { '--opt-height': '52px', '--show-key-hints': '0', '--content-pad': '20px' };

  const Component = componentMap[question.type];
  if (!Component) return <UnsupportedQuestion type={question.type} />;

  return (
    <div style={css as React.CSSProperties}>
      <Component question={question} answer={answer} onAnswer={onAnswer} showResult={showResult} result={result} />
    </div>
  );
}

const componentMap: Record<QuestionType, React.ComponentType<any>> = {
  'true_false':         TrueFalse,
  'multiple_choice':    MultipleChoice,
  'multiple_response':  MultipleResponse,
  'fill_in_blank':      FillInBlank,
  'matching':           Matching,
  'sequence':           Sequence,
  'word_bank':          WordBank,
  'click_map':          ClickMap,
  'short_essay':        ShortEssay,
  'blank_page':         BlankPage,
};
```

---

### 12.1 TrueFalse (Đúng/Sai đơn)

```
Layout:
  [Question text]
  ┌──────────────────────┐  ┌──────────────────────┐
  │  ◉  ĐÚNG             │  │  ○  SAI              │
  └──────────────────────┘  └──────────────────────┘

State machine:
  none → click ĐÚNG → selected(true)
  none → click SAI  → selected(false)
  selected → click khác → switch
  showResult=true → correct/wrong border

Key bindings: T = ĐÚNG, F = SAI (desktop only)
```

```typescript
// TrueFalse: 2 button ngang, height 56px, border-radius 8px
// KHÔNG dùng <input type="radio">
// Key hint: hiện "T" và "F" khi --show-key-hints = 1
const TrueFalse: React.FC<Props> = ({ question, answer, onAnswer, showResult, result }) => {
  const val = answer[0]; // 'true' | 'false' | undefined

  const getStyle = (optVal: 'true' | 'false') => {
    if (showResult) {
      const isCorrect = result?.correctAnswers?.includes(optVal);
      const isSelected = val === optVal;
      if (isSelected && isCorrect)  return 'correct';
      if (isSelected && !isCorrect) return 'wrong';
      if (!isSelected && isCorrect) return 'correct-dim'; // show correct even if not selected
    }
    return val === optVal ? 'selected' : 'default';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {(['true', 'false'] as const).map(opt => (
        <OptionButton
          key={opt}
          state={getStyle(opt)}
          onClick={() => !showResult && onAnswer([opt])}
          keyHint={opt === 'true' ? 'T' : 'F'}
          label={opt === 'true' ? 'ĐÚNG' : 'SAI'}
          style={{ justifyContent: 'center', fontSize: 15, fontWeight: 500 }}
        />
      ))}
    </div>
  );
};
```

---

### 12.2 MultipleChoice (Một lựa chọn — MCQ)

```
Layout:
  [Question text]
  [A] ○  Option A text
  [B] ●  Option B text   ← selected (blue bg)
  [C] ○  Option C text
  [D] ○  Option D text   ← correct (green, show after submit)

Key bindings: A B C D (desktop), 1 2 3 4 (alternate)
```

```typescript
// Key hint: 22×22px, monospace, bg gray-100, visible only when --show-key-hints=1
// Show correct answer in green even if user selected wrong (after showResult=true)
// Animate: none (no transition on selection state changes — too distracting during exam)
const keys = ['A', 'B', 'C', 'D', 'E', 'F']; // supports up to 6 choices

const getOptionState = (choiceId: string): OptionState => {
  if (!showResult) return answer.includes(choiceId) ? 'selected' : 'default';
  const isCorrect  = result?.correctAnswers?.includes(choiceId);
  const isSelected = answer.includes(choiceId);
  if (isSelected && isCorrect)  return 'correct';
  if (isSelected && !isCorrect) return 'wrong';
  if (!isSelected && isCorrect) return 'correct-dim'; // slightly visible — "here's the right answer"
  return 'default';
};
```

---

### 12.3 MultipleResponse (Nhiều đáp án)

```
Layout:
  [Question text]
  Hint: "Chọn 2 đáp án" (or "Chọn tất cả đúng")
  [A] ☐  Option A
  [B] ☑  Option B   ← checked
  [C] ☐  Option C
  [D] ☑  Option D   ← checked

Scoring: partial scoring supported (per-choice score in quiz-engine)
Counter: "Đã chọn: 2 / 3" shown as hint below question text
```

```typescript
// Checkbox: 18×18px, border-radius 4px (NOT rounded)
// ☑ checkmark: drawn with CSS/SVG, NOT unicode ✓ (renders differently on WebView2)
// Partial scoring: if question.partialScoring === true, show per-choice point hints
// Max selections: if question.maxSelections is set, prevent selecting more
```

---

### 12.4 FillInBlank (Điền vào chỗ trống)

```
Layout A — Inline blanks in sentence:
  "Đề xuất [____giá trị____] là quá trình [________] so với đối thủ."
  Cursor jumps to next blank on Tab/Enter

Layout B — Multiple separate inputs (when blanks > 2):
  Blank 1: [________________]
  Blank 2: [________________]

After submit:
  Correct: [  giá trị  ] ← green border, checkmark
  Wrong:   [  tốt hơn  ] ← red border, correct answer shown below
```

```typescript
interface FillInBlankQuestion extends BaseQuestion {
  template: string;        // "Đề xuất {{0}} là quá trình {{1}} so với đối thủ."
  blanks: BlankSpec[];     // [{ id: '0', label: 'Blank 1' }, ...]
  caseSensitive: boolean;  // default false
  trimWhitespace: boolean; // default true
}

// answers: string[] where index matches blank index
// onAnswer(['giá trị', 'tốt hơn']) — array of filled values

// Blank input styles:
const blankStyle = {
  border: 'none',
  borderBottom: '1.5px solid #3b82f6',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 500,
  color: '#1d4ed8',
  textAlign: 'center',
  padding: '0 6px',
  outline: 'none',
  minWidth: 80,
};
// Width auto-expands with content: use onInput to resize
```

---

### 12.5 Matching (Nối cột — Drag & Drop)

```
Layout:
  ┌─── Cột trái (thuật ngữ) ──┐  ┌─── Cột phải (mô tả) ────────┐
  │  .png         [← kết nối] │  │ ⠿ Hình vạch quét, trong suốt│
  │  .rtf                     │  │ ⠿ Văn bản thuần tuyến tính  │
  │  .txt                     │  │ ⠿ Hình ảnh độ nén cao, nhiều│
  │  .gif                     │  │ ⠿ Văn bản + đồ họa định dạng│
  └───────────────────────────┘  └──────────────────────────────┘

Interaction: drag right item → drop on left item
Mobile fallback: tap right item to select → tap left item to place
```

```typescript
// MANDATORY: use @dnd-kit/core — NOT react-beautiful-dnd (deprecated)
// @dnd-kit/sortable for reordering, @dnd-kit/core for cross-list drag

import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';

interface MatchingQuestion extends BaseQuestion {
  leftItems:  MatchItem[];  // [{ id, text }] — fixed column, cannot be dragged
  rightItems: MatchItem[];  // [{ id, text }] — draggable column, shuffled on load
}

// answers: string[] where each pair is "leftId:rightId"
// e.g. ['left-0:right-2', 'left-1:right-0', ...]

// Right item states:
// unplaced:  white bg, 0.5px border, drag cursor
// dragging:  dashed border, blue-50 bg, opacity 0.7
// placed:    shown as small label next to left item, blue border

// After submit:
// correct pair:  green-50 bg + green border on left item
// wrong pair:    red-50 bg + red border + show correct connection
```

---

### 12.6 Sequence (Sắp xếp thứ tự)

```
Layout:
  Số thứ tự │ Nội dung item                      │ ⠿
  ─────────────────────────────────────────────────
  [1]        Bật nguồn điện cho máy tính           ⠿
  [2]        BIOS/UEFI kiểm tra phần cứng (POST)   ⠿
  [3]        Hệ điều hành được tải vào bộ nhớ      ⠿
  [4]        Màn hình đăng nhập xuất hiện          ⠿
  [5]        Người dùng đăng nhập và Desktop       ⠿

Drag handle: ⠿ braille dots, right side, always visible
Number badge: auto-updates as items reorder
```

```typescript
// Use @dnd-kit/sortable
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

// answers: string[] — ordered array of itemIds
// ['item-0', 'item-2', 'item-1', ...] = current order

// Sequence item height: 48px desktop, 52px web
// Number badge: 24×24px, gray-100 bg, gray-700 text, border-radius 6px
// Drag handle: color gray-300, visible, click area 32×32px
// Active drag: item lifts with scale(1.02), others compress slightly
// Drop indicator: 2px blue line between items (NOT a placeholder box)
```

---

### 12.7 WordBank (Ngân hàng từ)

```
Layout:
  [Question text / sentence with drop zones]

  "Bộ nhớ [RAM ✕] là bộ nhớ [thả vào đây] và dữ liệu
   sẽ mất khi [tắt máy ✕]."

  ──────────────── ngân hàng từ ────────────────
  [RAM - used]  [ROM]  [tạm thời]  [vĩnh viễn]
  [tắt máy - used]  [khởi động lại]  [CPU]

Interaction:
  - Click word → places in next empty slot
  - Click filled slot × → returns word to bank
  - Drag word → drop on slot (desktop only)
```

```typescript
interface WordBankQuestion extends BaseQuestion {
  template: string;    // "Bộ nhớ {{0}} là bộ nhớ {{1}} và dữ liệu sẽ mất khi {{2}}."
  words: string[];     // full pool including distractors
  correctMap: Record<string, string>; // { '0': 'RAM', '1': 'tạm thời', '2': 'tắt máy' }
  // correctMap is server-side only — never sent to client
}

// answers: string[] where index = slot index, value = chosen word
// ['RAM', '', 'tắt máy'] = slot 0 filled, slot 1 empty, slot 2 filled

// Slot visual states:
// empty:  dashed border 1.5px, bg #f9fafb, placeholder "thả vào đây" in gray-400
// filled: blue bg (blue-50), blue border (blue-500), word text + ✕ remove button
// correct (after submit): green-50 bg, green border
// wrong (after submit):   red-50 bg, red border + small text showing correct word

// Bank word states:
// available: white bg, 0.5px border, hover: gray-50 bg
// used:      opacity 0.35, pointer-events none, cursor default
```

---

### 12.8 ClickMap (Click vào ảnh)

```
Layout:
  [Question text] (Chọn N)
  Hint: "Đã chọn: 1 / 2 · Click vào ảnh để đánh dấu"
  ┌────────────────────────────────────────────┐
  │                                            │
  │         [Image — full width]               │
  │                                            │
  │   ①                                        │  ← blue pin at click position
  │                                            │
  └────────────────────────────────────────────┘
  Pin 1: click to remove

After submit:
  Correct pin: green circle ✓
  Wrong pin:   red circle ✗
  Correct areas: green outline (optional, based on question config)
```

```typescript
interface ClickMapQuestion extends BaseQuestion {
  imageUrl: string;               // served from Vercel Blob
  imageAlt: string;
  maxSelections: number;          // 1, 2, 3...
  correctAreas: ClickArea[];      // server-only, never sent to client
  // correctAreas: [{ id, x, y, radius, label }] — percentage-based coordinates
}

// answers: string[] — each item is "x,y" percentage string
// e.g. ['12.5,34.2', '67.8,45.1']

// Pin component: 24×24px circle, white border 2px
// Numbered: 1, 2, 3...
// Position: absolute, transform: translate(-50%, -50%)
// Remove: click pin → removes that pin
// Cursor: crosshair over image area
// Max reached: show toast "Đã chọn đủ N vị trí" (only error state that uses toast)

// CRITICAL: coordinates stored as percentage (not px) for responsive display
// On submit, server converts % coords to px based on canonical image size
// Tolerance radius: defined per area in correctAreas (e.g. 5% radius)
```

---

### 12.9 ShortEssay (Tự luận ngắn)

```
Layout:
  [Question text]
  ┌────────────────────────────────────────────┐
  │                                            │
  │  Textarea — resizable, min 100px           │
  │                                            │
  │                                            │
  └────────────────────────────────────────────┘
  186 / 500 ký tự                    (char counter)

  ⚠ Câu tự luận sẽ được giáo viên chấm điểm thủ công.

Submit behavior:
  - Essay saved as plain text
  - Score = 0 until teacher grades manually
  - Teacher grading UI: separate screen in apps/creator
```

```typescript
interface ShortEssayQuestion extends BaseQuestion {
  maxLength: number;      // default 500
  minLength?: number;     // optional minimum
  hint?: string;          // shown below question text
  scoringType: 'manual';  // always manual — no auto-scoring
}

// answers: string[] where answers[0] = essay text
// Textarea style:
const textareaStyle = {
  width: '100%',
  minHeight: 100,
  border: '0.5px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: 14,
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
  // focus: border-color #3b82f6, box-shadow 0 0 0 3px rgba(59,130,246,0.12)
};

// char counter: right-aligned, 12px, gray-400
// turns amber when > 80% of maxLength
// turns red when > 95% of maxLength (but still allows typing to max)
```

---

### 12.10 BlankPage (Trang trống — Nội dung tĩnh)

```
Layout:
  ┌────────────────────────────────────────────┐
  │                                            │
  │   [Rich HTML content — read-only]          │
  │   (Text, images, tables, formatted)        │
  │                                            │
  └────────────────────────────────────────────┘
  No answer input. Footer shows only "Tiếp theo →".
  Does NOT count toward score. Progress bar still advances.
```

```typescript
interface BlankPageQuestion extends BaseQuestion {
  htmlContent: string;  // safe HTML (sanitized before storage)
  noScore: true;        // always true — never scores
}

// Render: dangerouslySetInnerHTML with DOMPurify sanitization
// answers: always [] — no interaction
// Footer: hide Prev/Next dots, only show "Tiếp theo →" button
// DO NOT show timer pill for blank pages (config option)
```

---

### 12.11 Player Shell — Full Spec

#### Header (56px, sticky, white)

```
┌─────────────────────────────────────────────────────────┐
│ [Q]  Train — Chủ đề 1: Căn bản về công nghệ   2/96  [05:24] [☰ Câu hỏi] │
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← 2px progress │
└─────────────────────────────────────────────────────────┘
```

- Logo "Q": 28×28px, border-radius 6px, bg #111, text white
- Quiz title: truncate with ellipsis, max-width calc(100% - 200px)
- Progress: "2 / 96" — monospace, 12px, gray-500
- Timer pill: monospace, transition colors by % remaining (see 11.9)
- "☰ Câu hỏi" button: ghost, 12px — opens Q-list side panel
- Progress bar: 2px, full-width, bottom edge, blue-500 fill

#### Content zone (flex-grow, bg #fafafa)

```typescript
// Question card spec:
const questionCard = {
  background: '#ffffff',
  border: '0.5px solid #e5e7eb',
  borderRadius: 10,
  padding: '22px 24px',     // desktop
  // padding: '20px 20px',  // web mobile
  maxWidth: 760,
  width: '100%',
  margin: '0 auto',
};

// Card header (question meta row):
// "câu 3 · một lựa chọn"    right-aligned: "10 điểm"
// 10px uppercase, gray-400, letter-spacing 0.07em

// Feedback block (shown after showResult=true):
// correct: bg green-50, border green-500, padding 12px 14px, border-radius 8px
// wrong:   bg red-50,   border red-500,   padding 12px 14px, border-radius 8px
// Content: icon (✓/✕) + feedback label + explanation text
```

#### Footer (64px, white)

```
┌─────────────────────────────────────────────────────────┐
│ ● ● ◉ ○ ○ ○ ○ ○ ○ ○          [← Trước]  [Tiếp theo →] │
└─────────────────────────────────────────────────────────┘
```

- Question dots: max 20 visible, then condensed (show range: "1-20 ...")
- Dot states: ● done (blue-500), ◉ current (blue border + white), ○ unanswered
- "Nộp bài" button appears instead of "Tiếp theo →" on last question
- "Nộp bài" triggers confirmation dialog ONLY if unanswered questions remain

#### Q-List Side Panel (320px, slides in from right)

```
┌─────────────────────────────────────────────────────────┐
│  Danh sách câu hỏi         5 / 96 đã làm        [✕]    │
│ ─────────────────────────────────────────────────────── │
│  01  Câu phát biểu về tính bảo mật...         ●         │
│  02  Khu vực cài đặt nhận thông báo?          ●         │
│  03  Nguyên tắc thiết kế phần cứng?           ●         │
│  06  Thêm cuộc họp vào Google Calendar        ◉  ← curr │
│  07  Thay đổi độ phân giải màn hình           ○         │
│ ─────────────────────────────────────────────────────── │
│  ● Đã làm   ○ Chưa làm          [Nộp bài]              │
└─────────────────────────────────────────────────────────┘
```

```typescript
// Panel behavior:
// Desktop: slides in as overlay (does NOT push main content)
// Web: slides in as full-screen overlay on mobile, side panel on tablet+
// Background: slightly blurred (filter: blur(2px)) when panel is open
// Click outside → close panel
// Click on question item → navigate to that question, close panel
// Escape key → close panel
```

---

### 12.12 Result Screen (Màn hình kết quả)

```
┌─────────────────────────────────────────────────────────┐
│  [Q]  Train — Chủ đề 1                                 │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│                    Kết quả bài làm                      │
│                                                         │
│              ╔════════════════════╗                     │
│              ║   85 / 100 điểm   ║                     │
│              ║        85%        ║                     │
│              ║   ✓  Đạt yêu cầu  ║  ← if >= passing%   │
│              ╚════════════════════╝                     │
│                                                         │
│  Thời gian: 12 phút 34 giây                            │
│  Đúng: 17 / 20 câu                                     │
│  Sai:  3 / 20 câu                                      │
│                                                         │
│  [Xem lại bài làm]          [Đóng / Thoát]             │
└─────────────────────────────────────────────────────────┘
```

```typescript
// Score circle: stroke-dasharray SVG circle, animates on mount
// Pass/Fail: compare percentage to quiz.passingPercentage
//   Pass: green-50 bg + green border + "✓ Đạt yêu cầu"
//   Fail: red-50 bg + red border + "✗ Chưa đạt"
// "Xem lại bài làm" → shows QuestionReview component
// QuestionReview: shows each question with selected answer + correct answer + feedback
```

---

### 12.13 Keyboard Navigation — Desktop Only

```typescript
// useKeyboardNav hook — active when platform === 'desktop'
// Only fires when no input/textarea is focused

const shortcuts: Record<string, () => void> = {
  'ArrowRight': () => session.next(),
  'ArrowLeft':  () => session.prev(),
  'Enter':      () => confirmAnswer(),
  'Space':      () => confirmAnswer(),
  // MCQ / T/F:
  'a': () => selectOption(0),
  'b': () => selectOption(1),
  'c': () => selectOption(2),
  'd': () => selectOption(3),
  't': () => selectTrueFalse('true'),
  'f': () => selectTrueFalse('false'),
  // Panel:
  'Escape': () => closeQList(),
};

// CRITICAL: disable all shortcuts when:
// 1. FillInBlank input is focused
// 2. ShortEssay textarea is focused
// 3. Q-list panel is open (only Escape works)
// 4. showResult === true (navigation only)
```

---

### 12.14 Lockdown Monitor

```typescript
// LockdownMonitor — invisible component, mounts on quiz start

// SOFT mode (default):
// - Listen to document.visibilitychange
// - On hide: record tabout event, show floating warning banner
// - Banner: "Bạn đã rời khỏi bài kiểm tra (lần 1/3)" — amber, top of screen
// - Banner dismisses on return (visibilitychange to visible)
// - After maxTabOuts: show final warning "Bài sẽ tự nộp khi bạn rời thêm lần nữa"

// STRICT mode:
// - Same as SOFT, but after maxTabOuts → force submit automatically
// - dispatch({ type: 'FORCE_SUBMIT' })

// NONE mode: no monitoring

// Desktop additional (Tauri only):
// - Block right-click (contextmenu preventDefault)
// - Block Ctrl+C / Ctrl+V on MCQ (not FIB/Essay)
// - Block F12 (DevTools)
// - These are Tauri window-level restrictions, NOT in quiz-player-ui package
// - quiz-player-ui only handles visibility events

// Warning banner spec:
const warningBanner = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
  background: '#fffbeb',
  borderBottom: '0.5px solid #f59e0b',
  padding: '10px 20px',
  fontSize: 13,
  color: '#b45309',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};
```

---

### 12.15 Start Screen (Màn hình bắt đầu)

```
┌─────────────────────────────────────────────────────────┐
│  [Q]  QuizForge                                        │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│         Train — Chủ đề 1: Căn bản về công nghệ         │
│                                                         │
│    Số câu:     96                                       │
│    Thời gian:  90 phút                                  │
│    Điểm đạt:   80%                                      │
│    Chế độ:     Giám sát (SOFT)                         │
│                                                         │
│    [Nhập họ tên nếu anonymous mode]                     │
│    ┌──────────────────────────────┐                     │
│    │ Họ và tên của bạn...         │                     │
│    └──────────────────────────────┘                     │
│                                                         │
│              [Bắt đầu làm bài →]                       │
│                                                         │
│    Lưu ý: Không rời khỏi tab trong khi làm bài.        │
└─────────────────────────────────────────────────────────┘
```

```typescript
// Start screen only shown when:
// 1. authMode === 'ANONYMOUS' (name input required)
// 2. authMode === 'ACCESS_CODE' (code input required)
// 3. authMode === 'REQUIRE_LOGIN' → skip start screen, go straight to quiz

// Access code input: 6-digit, auto-focus, monospace font, center-aligned
// Name input: standard text input
// "Bắt đầu làm bài →" → disabled until required fields filled
// On click: dispatch START action, timer begins
```
