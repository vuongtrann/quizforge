# QuizForge — AI Agent Technical Specification
> **FOR AI AGENT USE ONLY** — Execute in order, validate each step before proceeding
> Stack: Tauri 2 + React 18 + Vite + TanStack Suite + SQLite + shadcn/ui
> Target: Windows 10+ (primary), macOS, Linux (secondary)

---

## AGENT EXECUTION RULES

1. **Always** use `pnpm` as package manager (workspace monorepo)
2. **Always** use Turborepo for monorepo task orchestration
3. **Never** use `any` TypeScript type — use `unknown` + Zod parse
4. **Always** handle loading/error/empty states in every component
5. **Always** use TanStack Form + Zod for ALL form inputs
6. **Always** use TanStack Query for ALL async data (including Tauri commands)
7. **Always** use TanStack Router for ALL navigation
8. **Always** co-locate tests with implementation files
9. **Git commits**: conventional commits format (`feat:`, `fix:`, `chore:`)
10. **Rust**: use `thiserror` for error types, `serde` for all serialization

---

## PHASE 0: PROJECT SCAFFOLD

### 0.1 Initialize Monorepo

```bash
mkdir quizforge && cd quizforge
pnpm init
pnpm add -D turbo typescript @types/node
```

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

**`turbo.json`**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "out/**"]
    },
    "tauri": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "outputs": ["coverage/**"]
    }
  }
}
```

### 0.2 Shared Packages

```bash
mkdir -p packages/types packages/ui packages/quiz-engine
```

#### `packages/types/` — Shared Zod schemas + TypeScript types

**`packages/types/src/quiz.ts`** — IMPLEMENT THIS FULLY:
```typescript
import { z } from 'zod'

export const QuestionTypeSchema = z.enum([
  'true_false',
  'multiple_choice',
  'multiple_response',
  'fill_in_blank',
  'matching',
  'sequence',
  'word_bank',
  'click_map',
  'short_essay',
  'blank_page',
])
export type QuestionType = z.infer<typeof QuestionTypeSchema>

export const MediaSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['image', 'audio', 'video']),
  filename: z.string(),
  mimeType: z.string(),
  data: z.string(), // base64 or file path
  width: z.number().optional(),
  height: z.number().optional(),
})
export type Media = z.infer<typeof MediaSchema>

export const FeedbackSchema = z.object({
  correct: z.string().default('Chính xác !'),
  incorrect: z.string().default('Không chính xác !'),
})

export const BaseQuestionSchema = z.object({
  id: z.string().uuid(),
  type: QuestionTypeSchema,
  text: z.string().min(1, 'Question text is required'),
  richText: z.string().optional(), // HTML from Tiptap
  media: MediaSchema.optional(),
  points: z.object({
    correct: z.number().int().min(0).default(10),
    incorrect: z.number().int().default(0),
  }),
  feedback: FeedbackSchema,
  attempts: z.number().int().min(1).default(1),
  branching: z.string().optional(), // question ID to jump to
  group: z.string().optional(),
  order: z.number().int(),
})

// True/False
export const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('true_false'),
  correctAnswer: z.enum(['true', 'false']),
})

// Multiple Choice
export const MultipleChoiceOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  isCorrect: z.boolean(),
  feedback: z.string().optional(),
  media: MediaSchema.optional(),
})

export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  options: z.array(MultipleChoiceOptionSchema).min(2).max(10),
  shuffleOptions: z.boolean().default(false),
})

// Multiple Response
export const MultipleResponseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple_response'),
  options: z.array(MultipleChoiceOptionSchema).min(2).max(10),
  shuffleOptions: z.boolean().default(false),
  partialScoring: z.boolean().default(false),
})

// Fill in the Blank
export const BlankSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  acceptableAnswers: z.array(z.string()).min(1),
  caseSensitive: z.boolean().default(false),
  trimWhitespace: z.boolean().default(true),
})

export const FillInBlankQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('fill_in_blank'),
  templateText: z.string(), // Text with {{blank_id}} placeholders
  blanks: z.array(BlankSchema).min(1),
})

// Matching
export const MatchingPairSchema = z.object({
  id: z.string().uuid(),
  choice: z.string(),
  choiceMedia: MediaSchema.optional(),
  match: z.string(),
  matchMedia: MediaSchema.optional(),
})

export const MatchingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('matching'),
  pairs: z.array(MatchingPairSchema).min(2).max(10),
  shuffleChoices: z.boolean().default(true),
  shuffleMatches: z.boolean().default(true),
})

// Sequence
export const SequenceItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  media: MediaSchema.optional(),
  correctOrder: z.number().int(),
})

export const SequenceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('sequence'),
  items: z.array(SequenceItemSchema).min(2).max(10),
  partialScoring: z.boolean().default(false),
})

// Word Bank
export const WordBankSlotSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  correctWordId: z.string().uuid(),
})

export const WordBankWordSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  isDistractor: z.boolean().default(false),
})

export const WordBankQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('word_bank'),
  templateText: z.string(),
  slots: z.array(WordBankSlotSchema).min(1),
  words: z.array(WordBankWordSchema).min(1),
  shuffleWords: z.boolean().default(true),
})

// Click Map (Hotspot)
export const HotspotSchema = z.object({
  id: z.string().uuid(),
  shape: z.enum(['rect', 'circle', 'polygon']),
  coords: z.array(z.number()),  // [x, y, w, h] for rect; [cx, cy, r] for circle; [x1,y1,...] for polygon
  isCorrect: z.boolean(),
  label: z.string().optional(),
})

export const ClickMapQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('click_map'),
  mapImage: MediaSchema,
  hotspots: z.array(HotspotSchema).min(1),
  allowMultipleClicks: z.boolean().default(false),
})

// Short Essay
export const ShortEssayQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('short_essay'),
  referenceAnswer: z.string().optional(),
  keywordMatching: z.array(z.string()).default([]),
  maxWords: z.number().int().optional(),
})

// Blank Page
export const BlankPageSchema = BaseQuestionSchema.extend({
  type: z.literal('blank_page'),
  title: z.string(),
  content: z.string(), // Rich HTML
  showTimer: z.boolean().default(true),
})

// Union type for all questions
export const QuestionSchema = z.discriminatedUnion('type', [
  TrueFalseQuestionSchema,
  MultipleChoiceQuestionSchema,
  MultipleResponseQuestionSchema,
  FillInBlankQuestionSchema,
  MatchingQuestionSchema,
  SequenceQuestionSchema,
  WordBankQuestionSchema,
  ClickMapQuestionSchema,
  ShortEssayQuestionSchema,
  BlankPageSchema,
])
export type Question = z.infer<typeof QuestionSchema>

// Quiz Settings
export const QuizSettingsSchema = z.object({
  passingRate: z.number().min(0).max(100).default(95),
  timeLimit: z.object({
    enabled: z.boolean().default(false),
    durationSeconds: z.number().int().min(60).default(3600),
    warningAtPercent: z.number().min(0).max(100).default(20),
  }),
  randomization: z.object({
    randomizeQuestions: z.boolean().default(false),
    randomCount: z.number().int().optional(),
    randomizeOptions: z.boolean().default(false),
  }),
  submission: z.object({
    mode: z.enum(['per_question', 'all_at_once']).default('per_question'),
    showCorrectAfterSubmit: z.boolean().default(true),
    allowReview: z.boolean().default(true),
    oneAttemptOnly: z.boolean().default(false),
    promptResume: z.boolean().default(true),
  }),
})

export const QuizResultSettingsSchema = z.object({
  feedbackMode: z.enum(['by_result', 'always']).default('by_result'),
  passMessage: z.string().default('Chúc mừng, bạn đã đạt !'),
  failMessage: z.string().default('Bạn chưa đạt, cố gắng hơn nhé !'),
  showStatisticsOnResult: z.boolean().default(true),
  finishButton: z.object({
    show: z.boolean().default(false),
    passUrl: z.string().url().optional(),
    failUrl: z.string().url().optional(),
    openInCurrentWindow: z.boolean().default(true),
  }),
})

export const QuizInformationSchema = z.object({
  title: z.string().min(1).default('New Quiz'),
  author: z.string().optional(),
  description: z.string().optional(),
  introduction: z.object({
    enabled: z.boolean().default(true),
    content: z.string().default(''),
    audioId: z.string().optional(),
    mediaId: z.string().optional(),
  }),
  showStatistics: z.boolean().default(true),
  collectParticipantData: z.object({
    enabled: z.boolean().default(false),
    fields: z.array(z.enum(['name', 'email', 'student_id', 'class'])).default([]),
  }),
})

export const QuizSecuritySchema = z.object({
  protection: z.enum(['none', 'password', 'user_id_password']).default('none'),
  password: z.string().optional(),
  users: z.array(z.object({ id: z.string(), name: z.string(), password: z.string() })).default([]),
  domainRestriction: z.object({
    enabled: z.boolean().default(false),
    domain: z.string().optional(),
  }),
})

export const ThemeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().default('Default'),
  primaryColor: z.string().default('#ef4444'),
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#1f2937'),
  progressStyle: z.enum(['bar', 'dots', 'number']).default('bar'),
  navigationStyle: z.enum(['buttons', 'sidebar', 'floating']).default('buttons'),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().default(16),
  showTimer: z.boolean().default(true),
  roundedCorners: z.boolean().default(true),
})

export const QuizSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.string().default('1.0.0'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  information: QuizInformationSchema,
  settings: QuizSettingsSchema,
  result: QuizResultSettingsSchema,
  security: QuizSecuritySchema,
  theme: ThemeSchema,
  questions: z.array(QuestionSchema),
})
export type Quiz = z.infer<typeof QuizSchema>

// Student
export const StudentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string(),
  name: z.string().min(1),
  className: z.string().optional(),
  email: z.string().email().optional(),
})
export type Student = z.infer<typeof StudentSchema>

export const StudentListSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  importedAt: z.string().datetime(),
  students: z.array(StudentSchema),
})

// Quiz Result (from player)
export const QuestionResultSchema = z.object({
  questionId: z.string().uuid(),
  questionType: QuestionTypeSchema,
  studentAnswer: z.unknown(),
  isCorrect: z.boolean().optional(), // null for short essay
  pointsEarned: z.number(),
  timeSpentSeconds: z.number(),
})

export const QuizResultSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  quizTitle: z.string(),
  studentId: z.string().optional(),
  studentName: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  totalPoints: z.number(),
  earnedPoints: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  questionResults: z.array(QuestionResultSchema),
  machineId: z.string().optional(),
  submittedVia: z.enum(['http', 'lan', 'local']).default('local'),
})
export type QuizResult = z.infer<typeof QuizResultSchema>
```

---

## PHASE 1: CREATOR APP SETUP

### 1.1 Init Tauri 2 + React App

```bash
cd apps
pnpm create tauri-app creator --template react-ts --manager pnpm
cd creator
pnpm add @tauri-apps/api@^2 @tauri-apps/plugin-sql@^2 @tauri-apps/plugin-fs@^2 \
  @tauri-apps/plugin-dialog@^2 @tauri-apps/plugin-updater@^2 \
  @tauri-apps/plugin-shell@^2 @tauri-apps/plugin-notification@^2
```

```bash
pnpm add @tanstack/react-query@^5 @tanstack/react-router@^1 \
  @tanstack/react-table@^8 @tanstack/react-form@^0 \
  zustand@^4 zod@^3 \
  @tiptap/react@^2 @tiptap/starter-kit @tiptap/extension-image \
  @dnd-kit/core@^6 @dnd-kit/sortable @dnd-kit/utilities \
  xlsx@^0.18 lucide-react \
  tailwindcss@^3 @tailwindcss/typography postcss autoprefixer \
  class-variance-authority clsx tailwind-merge \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-progress \
  @radix-ui/react-tooltip @radix-ui/react-separator \
  @radix-ui/react-alert-dialog @radix-ui/react-popover
```

### 1.2 Tauri Config (`src-tauri/tauri.conf.json`)

```json
{
  "productName": "QuizForge Creator",
  "version": "0.1.0",
  "identifier": "com.quizforge.creator",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{
      "title": "QuizForge Creator",
      "width": 1280,
      "height": 800,
      "minWidth": 1024,
      "minHeight": 600,
      "center": true,
      "decorations": true,
      "resizable": true
    }],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: blob: data:;"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "resources": [
      "resources/player/**"
    ]
  },
  "plugins": {
    "updater": {
      "endpoints": ["https://YOUR_SERVER/api/updates/{{target}}/{{arch}}/{{current_version}}"],
      "dialog": true,
      "pubkey": "YOUR_UPDATER_PUBLIC_KEY"
    },
    "sql": {
      "preloadConnections": ["sqlite:quizforge.db"]
    }
  }
}
```

### 1.3 SQLite Schema (Rust — `src-tauri/src/database/schema.rs`)

```sql
-- Run at app startup via tauri-plugin-sql migrations

CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    schema_version TEXT NOT NULL DEFAULT '1.0.0',
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settings_json TEXT NOT NULL DEFAULT '{}',
    result_settings_json TEXT NOT NULL DEFAULT '{}',
    information_json TEXT NOT NULL DEFAULT '{}',
    security_json TEXT NOT NULL DEFAULT '{}',
    theme_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    rich_text TEXT,
    media_id TEXT,
    points_correct INTEGER NOT NULL DEFAULT 10,
    points_incorrect INTEGER NOT NULL DEFAULT 0,
    feedback_correct TEXT NOT NULL DEFAULT 'Chính xác !',
    feedback_incorrect TEXT NOT NULL DEFAULT 'Không chính xác !',
    attempts INTEGER NOT NULL DEFAULT 1,
    branching TEXT,
    question_group TEXT,
    type_data_json TEXT NOT NULL DEFAULT '{}'
    -- type_data_json stores type-specific fields (options, pairs, etc.)
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, order_index);

CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_path TEXT NOT NULL,  -- relative to quiz media dir
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_lists (
    id TEXT PRIMARY KEY,
    quiz_id TEXT REFERENCES quizzes(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES student_lists(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    quiz_title TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME NOT NULL,
    total_points INTEGER NOT NULL,
    earned_points INTEGER NOT NULL,
    percentage REAL NOT NULL,
    passed INTEGER NOT NULL,  -- 0 or 1
    question_results_json TEXT NOT NULL,
    machine_id TEXT,
    submitted_via TEXT NOT NULL DEFAULT 'local',
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES
    ('result_server_url', ''),
    ('lan_receive_port', '41235'),
    ('auto_update_enabled', 'true'),
    ('theme', 'light'),
    ('default_passing_rate', '95'),
    ('default_correct_feedback', 'Chính xác !'),
    ('default_incorrect_feedback', 'Không chính xác !');
```

### 1.4 Rust Commands (`src-tauri/src/commands/`)

**`quiz_commands.rs`** — implement ALL:
```rust
use tauri::State;
use crate::db::DbState;
use crate::models::{Quiz, Question, CreateQuizDto, UpdateQuizDto};
use crate::error::AppError;

#[tauri::command]
pub async fn get_all_quizzes(db: State<'_, DbState>) -> Result<Vec<Quiz>, AppError> {}

#[tauri::command]
pub async fn get_quiz(id: String, db: State<'_, DbState>) -> Result<Quiz, AppError> {}

#[tauri::command]
pub async fn create_quiz(dto: CreateQuizDto, db: State<'_, DbState>) -> Result<Quiz, AppError> {}

#[tauri::command]
pub async fn update_quiz(id: String, dto: UpdateQuizDto, db: State<'_, DbState>) -> Result<Quiz, AppError> {}

#[tauri::command]
pub async fn delete_quiz(id: String, db: State<'_, DbState>) -> Result<(), AppError> {}

#[tauri::command]
pub async fn duplicate_quiz(id: String, db: State<'_, DbState>) -> Result<Quiz, AppError> {}

#[tauri::command]
pub async fn export_quiz_file(id: String, output_path: String, db: State<'_, DbState>) -> Result<(), AppError> {}
// → saves as .qfz (ZIP: manifest.json + quiz.json + questions.json + media/)

#[tauri::command]
pub async fn import_quiz_file(file_path: String, db: State<'_, DbState>) -> Result<Quiz, AppError> {}

#[tauri::command]
pub async fn export_player_exe(
    quiz_id: String,
    output_path: String,
    include_offline_webview: bool,
    db: State<'_, DbState>,
) -> Result<ExportResult, AppError> {}
// Critical: embed player.exe + encrypted quiz.dat into NSIS SFX
```

**`question_commands.rs`**:
```rust
#[tauri::command]
pub async fn add_question(quiz_id: String, question: NewQuestion, db: State<'_, DbState>) -> Result<Question, AppError> {}

#[tauri::command]
pub async fn update_question(id: String, question: UpdateQuestion, db: State<'_, DbState>) -> Result<Question, AppError> {}

#[tauri::command]
pub async fn delete_question(id: String, db: State<'_, DbState>) -> Result<(), AppError> {}

#[tauri::command]
pub async fn reorder_questions(quiz_id: String, order: Vec<String>, db: State<'_, DbState>) -> Result<(), AppError> {}

#[tauri::command]
pub async fn duplicate_question(id: String, db: State<'_, DbState>) -> Result<Question, AppError> {}
```

**`media_commands.rs`**:
```rust
#[tauri::command]
pub async fn upload_media(quiz_id: String, file_path: String, db: State<'_, DbState>) -> Result<MediaFile, AppError> {}

#[tauri::command]
pub async fn delete_media(id: String, db: State<'_, DbState>) -> Result<(), AppError> {}

#[tauri::command]
pub async fn get_media_data(id: String, db: State<'_, DbState>) -> Result<String, AppError> {} // base64
```

**`student_commands.rs`**:
```rust
#[tauri::command]
pub async fn import_student_list(excel_path: String, list_name: String, quiz_id: Option<String>, db: State<'_, DbState>) -> Result<StudentList, AppError> {}

#[tauri::command]
pub async fn get_student_lists(db: State<'_, DbState>) -> Result<Vec<StudentList>, AppError> {}

#[tauri::command]
pub async fn get_student_template_path() -> Result<String, AppError> {}
// Returns path to generated template Excel file
```

**`network_commands.rs`**:
```rust
#[tauri::command]
pub async fn start_lan_receiver(port: u16, state: State<'_, LanServerState>) -> Result<(), AppError> {}

#[tauri::command]
pub async fn stop_lan_receiver(state: State<'_, LanServerState>) -> Result<(), AppError> {}

#[tauri::command]
pub async fn get_lan_server_status(state: State<'_, LanServerState>) -> Result<LanServerStatus, AppError> {}
// Emits: "result-received" event to frontend when result arrives

#[tauri::command]
pub async fn get_local_ip() -> Result<String, AppError> {}
```

**`result_commands.rs`**:
```rust
#[tauri::command]
pub async fn get_quiz_results(quiz_id: String, db: State<'_, DbState>) -> Result<Vec<QuizResult>, AppError> {}

#[tauri::command]
pub async fn export_results_excel(quiz_id: String, output_path: String, db: State<'_, DbState>) -> Result<(), AppError> {}

#[tauri::command]
pub async fn delete_result(id: String, db: State<'_, DbState>) -> Result<(), AppError> {}
```

---

## PHASE 2: CREATOR FRONTEND

### 2.1 Router Setup (`src/router.ts`)

```typescript
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'

// Routes:
// /                    → Dashboard (quiz list)
// /quiz/new            → Create new quiz wizard
// /quiz/$quizId        → Quiz editor
// /quiz/$quizId/properties → Quiz properties
// /quiz/$quizId/questions  → Questions list
// /quiz/$quizId/questions/$questionId → Question editor
// /quiz/$quizId/theme  → Player template
// /quiz/$quizId/students → Student list manager
// /quiz/$quizId/results  → Results dashboard
// /settings            → App settings
// /receive             → LAN result receiver mode
```

### 2.2 TanStack Query Setup (`src/lib/queryClient.ts`)

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 30,   // 30 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Global error toast
        console.error('Mutation error:', error)
      },
    },
  },
})
```

### 2.3 Tauri Query Hooks (`src/hooks/useQuizzes.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { QuizSchema, type Quiz } from '@quizforge/types'
import { z } from 'zod'

export const quizKeys = {
  all: ['quizzes'] as const,
  detail: (id: string) => ['quizzes', id] as const,
  questions: (quizId: string) => ['quizzes', quizId, 'questions'] as const,
  results: (quizId: string) => ['quizzes', quizId, 'results'] as const,
}

export function useQuizzes() {
  return useQuery({
    queryKey: quizKeys.all,
    queryFn: async () => {
      const raw = await invoke<unknown[]>('get_all_quizzes')
      return z.array(QuizSchema).parse(raw)
    },
  })
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: async () => {
      const raw = await invoke<unknown>('get_quiz', { id })
      return QuizSchema.parse(raw)
    },
    enabled: !!id,
  })
}

export function useCreateQuiz() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Quiz>) => {
      const raw = await invoke<unknown>('create_quiz', { dto: data })
      return QuizSchema.parse(raw)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  })
}

export function useUpdateQuiz(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Quiz>) => {
      const raw = await invoke<unknown>('update_quiz', { id, dto: data })
      return QuizSchema.parse(raw)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizKeys.detail(id) })
      qc.invalidateQueries({ queryKey: quizKeys.all })
    },
  })
}

// Similar hooks for: useDeleteQuiz, useDuplicateQuiz,
// useExportQuizFile, useImportQuizFile, useExportPlayerExe
```

### 2.4 Question Editor Components (`src/components/questions/`)

Create one editor component per question type. Each MUST:
- Accept `question: Question | null` (null = creating new)
- Use TanStack Form + Zod for validation
- Emit `onSave(question: Question)` and `onCancel()`
- Support media attachment (image/audio/video)
- Support rich text via Tiptap for question text

**Component list to implement**:
```
TrueFalseEditor.tsx
MultipleChoiceEditor.tsx
MultipleResponseEditor.tsx
FillInBlankEditor.tsx       ← complex: inline blank insertion in Tiptap
MatchingEditor.tsx          ← @dnd-kit for reordering pairs
SequenceEditor.tsx          ← @dnd-kit for ordering
WordBankEditor.tsx          ← @dnd-kit for word bank
ClickMapEditor.tsx          ← Canvas-based hotspot drawing
ShortEssayEditor.tsx
BlankPageEditor.tsx
```

**ClickMapEditor.tsx special requirements**:
- HTML5 Canvas overlay on top of imported image
- Draw rect/circle/polygon hotspots with mouse
- Each hotspot: mark as correct/incorrect
- Edit/delete existing hotspots

### 2.5 Question List (`src/components/QuestionList.tsx`)

Use **TanStack Table v8** with:
- Columns: ID, Type (with icon), Question preview, Feedback, Group, Points, Media (icon)
- Row click → open editor
- Drag to reorder (via @dnd-kit)
- Multi-select + bulk delete
- Sort by type (left panel tree view mirroring QuizCreator)
- Context menu: Edit, Duplicate, Delete, Move to Group

### 2.6 Quiz Properties Modal (`src/components/QuizProperties.tsx`)

**5 tabs using Radix Tabs**:

Tab 1 - Quiz Information:
- TanStack Form fields: title, author
- Tiptap editor for introduction
- File upload for audio/media
- Checkbox: display introduction page
- Checkbox: collect participant data + field selectors

Tab 2 - Quiz Settings:
- Passing rate: number input + slider
- Time limit: toggle + duration picker
- Randomization checkboxes
- Submission mode: radio group
- All using TanStack Form + Zod

Tab 3 - Quiz Result:
- Radio: by_result / always
- Two Tiptap editors (pass/fail messages)
- Checkbox: show statistics
- Finish button config

Tab 4 - Question Settings:
- Points input (positive/negative)
- Shuffle toggles
- Feedback text inputs
- Font pickers with "Apply to All" buttons

Tab 5 - Others:
- Password protection radio group
- User management table (TanStack Table)
- Domain restriction
- Page meta

### 2.7 Player Template Editor (`src/components/PlayerTemplate.tsx`)

- Theme gallery (pre-built themes as JSON presets)
- Live preview panel (iframe or React render of quiz player)
- Color pickers for: primary, background, text
- Progress style selector (bar/dots/number)
- Navigation style selector
- Font family selector
- Font size slider
- Toggle switches for: timer, rounded corners

### 2.8 Student List Manager (`src/components/StudentListManager.tsx`)

- Download template button → invoke `get_student_template_path`
- Drag-drop or click to import Excel
- Preview table (TanStack Table): STT, Name, Student ID, Class, Email
- Validation errors highlighted
- Associate list with quiz
- Save to SQLite

### 2.9 Export Player Dialog (`src/components/ExportPlayerDialog.tsx`)

```
□ Include offline WebView2 runtime (~150MB)
  └─ Warning: "Output file will be ~180MB"
□ Online only (requires system WebView2)
  └─ "Output file will be ~25MB"
  └─ "Requires Windows 10 with latest updates"

Output filename: [Quiz Title]_Player.exe
Output directory: [Browse...]

[Advanced]
  Encryption key display (read-only, auto-generated)
  Result server URL: [text input]
  LAN receive port: [number input]

[Cancel] [Export]
```

Progress dialog during export with steps:
1. Validating quiz data
2. Encrypting quiz content
3. Bundling player shell
4. Generating installer
5. Done ✓

### 2.10 Dashboard (`src/pages/Dashboard.tsx`)

- Grid/list view toggle of all quizzes
- Quiz card: title, question count, created date, modified date
- Actions per card: Open, Duplicate, Export Player, Delete
- Search/filter bar
- Sort: by date, by name, by question count
- Import .qfz button
- Create New Quiz button → Wizard

### 2.11 LAN Receiver Mode (`src/pages/ReceiveMode.tsx`)

- Show local IP address prominently
- Show port number
- Status: Listening / Stopped
- Toggle start/stop
- Real-time results list (using Tauri event listener)
- Each result row: student name, score, timestamp
- Export all to Excel button

---

## PHASE 3: PLAYER SHELL APP

### 3.1 Init Minimal Tauri 2 App

```bash
cd apps
pnpm create tauri-app player --template react-ts --manager pnpm
cd player
pnpm add @tauri-apps/api@^2
# Minimal deps only:
pnpm add zustand@^4 zod@^3 @dnd-kit/core@^6 @dnd-kit/sortable @dnd-kit/utilities
```

### 3.2 Player Tauri Config (Critical Security Settings)

**`src-tauri/tauri.conf.json`**:
```json
{
  "productName": "QuizForge Player",
  "identifier": "com.quizforge.player",
  "app": {
    "windows": [{
      "title": "QuizForge Player",
      "fullscreen": false,
      "resizable": true,
      "width": 1024,
      "height": 768,
      "minWidth": 800,
      "minHeight": 600
    }],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;",
      "dangerousDisableAssetCspModification": false,
      "assetProtocol": { "enable": true, "scope": ["$RESOURCE/**"] }
    }
  }
}
```

### 3.3 Player Rust Backend (`src-tauri/src/`)

**`main.rs`** — Critical initialization:
```rust
fn main() {
    // SINGLE INSTANCE CHECK — must be first
    let mutex_name = get_quiz_mutex_name(); // derived from embedded quiz_id
    let _mutex = create_named_mutex(&mutex_name)
        .expect("Another instance is already running");

    tauri::Builder::default()
        // Disable devtools in production
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                for window in app.windows().values() {
                    // Disable right-click context menu
                    window.eval("document.addEventListener('contextmenu', e => e.preventDefault())")?;
                }
            }
            // Load and decrypt quiz data
            let quiz_data = load_and_decrypt_quiz()?;
            app.manage(QuizState::new(quiz_data));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_quiz_data,
            get_students,
            validate_answer,  // CRITICAL: answer checking ONLY in Rust
            submit_result,
            discover_lan_server,
            send_result_lan,
            send_result_http,
            get_machine_id,
        ])
        .run(tauri::generate_context!())
        .expect("error while running quiz player");
}
```

**`commands/validate.rs`** — Answer validation (NEVER expose to JS):
```rust
/// All answer validation happens here in Rust.
/// Frontend never receives correct answers, only validation results.
#[tauri::command]
pub fn validate_answer(
    question_id: String,
    student_answer: serde_json::Value,
    state: State<'_, QuizState>,
) -> Result<ValidationResult, AppError> {
    let quiz = state.quiz.lock().unwrap();
    let question = quiz.questions.iter()
        .find(|q| q.id == question_id)
        .ok_or(AppError::QuestionNotFound)?;
    
    let (is_correct, points_earned) = match &question.question_type_data {
        QuestionTypeData::TrueFalse { correct_answer } => {
            let answer = student_answer.as_str().unwrap_or("");
            let correct = answer == correct_answer;
            (correct, if correct { question.points_correct } else { question.points_incorrect })
        },
        QuestionTypeData::MultipleChoice { options } => {
            let selected_id = student_answer.as_str().unwrap_or("");
            let correct = options.iter().any(|o| o.id == selected_id && o.is_correct);
            (correct, if correct { question.points_correct } else { question.points_incorrect })
        },
        // ... implement all 10 types
    };
    
    Ok(ValidationResult {
        is_correct,
        points_earned,
        correct_feedback: question.feedback_correct.clone(),
        incorrect_feedback: question.feedback_incorrect.clone(),
        // NEVER return correct_answer here
    })
}
```

**`commands/network.rs`**:
```rust
#[tauri::command]
pub async fn discover_lan_server(timeout_ms: u64) -> Result<Vec<ServerInfo>, AppError> {
    // 1. Try mDNS: _quizforge._tcp.local
    // 2. Try UDP broadcast on port 41234
    // Return list of found servers with IP + port
}

#[tauri::command]
pub async fn send_result_lan(
    server_ip: String,
    port: u16,
    result: serde_json::Value,
) -> Result<(), AppError> {
    // TCP connect to server_ip:port
    // Send JSON result
    // Wait for ACK
}

#[tauri::command]
pub async fn send_result_http(
    url: String,
    result: serde_json::Value,
    retry_count: u32,
) -> Result<(), AppError> {
    // POST to url with result JSON
    // Retry up to retry_count times with exponential backoff
}
```

### 3.4 Player Frontend (`src/`)

**State Management (`src/store/playerStore.ts`)** — Zustand:
```typescript
interface PlayerState {
  // Quiz data (received from Rust, NO answers)
  quiz: QuizForPlayer | null
  students: Student[]
  
  // Session state
  selectedStudent: Student | null
  currentQuestionIndex: number
  answers: Map<string, unknown>
  questionResults: QuestionResult[]
  startTime: Date | null
  questionStartTime: Date | null
  
  // UI state
  phase: 'intro' | 'quiz' | 'reviewing' | 'result'
  outlinePanelOpen: boolean
  feedbackVisible: boolean
  lastValidationResult: ValidationResult | null
  
  // Actions
  selectStudent: (student: Student) => void
  startQuiz: () => void
  setAnswer: (questionId: string, answer: unknown) => void
  submitAnswer: () => Promise<void>
  nextQuestion: () => void
  prevQuestion: () => void
  jumpToQuestion: (index: number) => void
  submitAll: () => Promise<void>
}
```

**Keyboard Handler (`src/hooks/useKeyboardNavigation.ts`)**:
```typescript
export function useKeyboardNavigation() {
  const store = usePlayerStore()
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.key)) {
        e.preventDefault()
      }
      
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          store.nextQuestion(); break
        case 'ArrowLeft':
        case 'PageUp':
          store.prevQuestion(); break
        case ' ':
        case 'Enter':
          if (store.phase === 'quiz') store.submitAnswer(); break
        case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8':
          // Select numbered option in MC/MR/TF
          selectOptionByIndex(parseInt(e.key) - 1); break
        case 'Escape':
          store.toggleOutlinePanel(); break
        case 'f': case 'F':
          if (e.ctrlKey) toggleFullscreen(); break
        case 'Enter':
          if (e.ctrlKey) store.submitAll(); break
      }
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store])
}
```

**Question Renderers (`src/components/player/questions/`)**:

Implement one renderer per type (read-only display for player):
```
TrueFalsePlayer.tsx
MultipleChoicePlayer.tsx
MultipleResponsePlayer.tsx
FillInBlankPlayer.tsx
MatchingPlayer.tsx      ← drag & drop (dnd-kit)
SequencePlayer.tsx      ← drag & drop (dnd-kit)
WordBankPlayer.tsx      ← drag & drop (dnd-kit)
ClickMapPlayer.tsx      ← canvas overlay, click detection
ShortEssayPlayer.tsx    ← textarea
BlankPagePlayer.tsx     ← static render
```

**Result Submission Flow (`src/pages/ResultPage.tsx`)**:
```typescript
async function submitResult(result: QuizResult) {
  setStatus('submitting')
  
  // Try HTTP first
  try {
    const hasInternet = await invoke<boolean>('check_internet')
    if (hasInternet) {
      await invoke('send_result_http', { url: quiz.resultServerUrl, result, retryCount: 3 })
      setStatus('submitted_http')
      return
    }
  } catch {}
  
  // Try LAN discovery
  setStatus('discovering_lan')
  try {
    const servers = await invoke<ServerInfo[]>('discover_lan_server', { timeoutMs: 5000 })
    if (servers.length > 0) {
      await invoke('send_result_lan', { serverIp: servers[0].ip, port: servers[0].port, result })
      setStatus('submitted_lan')
      return
    }
  } catch {}
  
  // Manual IP input
  setStatus('manual_required')
  // Show input for manual IP
}
```

---

## PHASE 4: PLAYER BUNDLER (Rust Tool)

### 4.1 NSIS Packaging (`tools/player-bundler/`)

**Strategy**:
1. Creator pre-compiles `player.exe` and embeds it as a Tauri resource
2. When exporting, Rust code:
   a. Reads `player.exe` from resources
   b. Encrypts quiz data → `quiz.dat`
   c. Generates NSIS script
   d. Runs `makensis.exe` (bundled with Creator) to create final `.exe`

**NSIS Script Template**:
```nsis
!include "MUI2.nsh"

Name "{{QUIZ_TITLE}}"
OutFile "{{OUTPUT_PATH}}"
InstallDir "$TEMP\quizforge_{{QUIZ_ID}}"
SilentInstall silent

Section "Main"
  SetOutPath "$INSTDIR"
  File "player.exe"
  File "quiz.dat"
  {{#if INCLUDE_STUDENTS}}
  File "students.dat"
  {{/if}}
  
  ; Check WebView2
  {{#unless OFFLINE_WEBVIEW}}
  ReadRegDword $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  StrCmp $0 "" 0 webview_found
    File "MicrosoftEdgeWebview2Setup.exe"
    ExecWait "$INSTDIR\MicrosoftEdgeWebview2Setup.exe /silent /install"
  webview_found:
  {{/unless}}
  
  Exec '"$INSTDIR\player.exe"'
SectionEnd

; Cleanup on exit
Function .onGUIEnd
  RMDir /r "$INSTDIR"
FunctionEnd
```

### 4.2 Quiz Data Encryption (Rust)

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};

pub fn encrypt_quiz_data(quiz_json: &str, quiz_id: &str) -> Result<Vec<u8>> {
    let key_material = format!("{}-{}-quizforge-2025", quiz_id, get_machine_fingerprint());
    let key_bytes = sha2::Sha256::digest(key_material.as_bytes());
    let key = Key::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    let nonce_bytes = rand::random::<[u8; 12]>();
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, quiz_json.as_bytes())
        .map_err(|e| AppError::Encryption(e.to_string()))?;
    
    // Format: [12 bytes nonce][N bytes ciphertext]
    let mut result = nonce_bytes.to_vec();
    result.extend(ciphertext);
    Ok(result)
}
```

---

## PHASE 5: CI/CD & RELEASE

### 5.1 GitHub Actions (`.github/workflows/build-creator.yml`)

```yaml
name: Build Creator

on:
  push:
    tags: ['v*']

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: dtolnay/rust-toolchain@stable
      - name: Install NSIS
        run: choco install nsis
      - name: Build Creator
        run: pnpm turbo build --filter=creator
      - name: Build Tauri
        uses: tauri-apps/tauri-action@v0
        with:
          projectPath: apps/creator
          tauriScript: pnpm tauri
        env:
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
      - name: Upload to Release
        uses: softprops/action-gh-release@v1
```

### 5.2 Update Server Endpoint Format

Host at `https://your-domain.com/api/updates/{target}/{arch}/{current_version}`:
```json
{
  "version": "1.0.1",
  "notes": "Mô tả các thay đổi",
  "pub_date": "2025-03-07T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ...",
      "url": "https://your-domain.com/releases/v1.0.1/QuizForge_Creator_1.0.1_x64-setup.exe"
    }
  }
}
```

---

## PHASE 6: TESTING STRATEGY

### Unit Tests (Vitest)
- All Zod schemas validation
- Quiz engine logic (scoring, answer validation)
- Utility functions

### Integration Tests (Tauri + Vitest)
- Tauri commands with real SQLite
- File import/export round-trip
- Student Excel import

### E2E Tests (Playwright)
- Create quiz → add questions → export player
- Import .qfz → verify data integrity
- Player: complete quiz → verify result

### Manual Test Checklist
```
Windows 10 clean install:
□ Creator installs correctly
□ SQLite DB created at %APPDATA%\QuizForge\
□ Create quiz with all 10 question types
□ Import student Excel list
□ Export .qfz file → re-import → verify identical
□ Export player .exe (online)
□ Player .exe runs without Creator installed
□ Named mutex prevents double-open
□ DevTools F12 disabled in player
□ Right-click disabled in player
□ All keyboard shortcuts work
□ Timer counts down correctly
□ LAN discovery finds Creator machine
□ Result sent via LAN
□ Result sent via HTTP
□ Auto-update detects new version
□ RAM < 150MB (Creator), < 80MB (Player)
```

---

## FILE STRUCTURE (FINAL)

```
quizforge/
├── apps/
│   ├── creator/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── questions/         # 10 question editors
│   │   │   │   ├── QuizProperties.tsx
│   │   │   │   ├── PlayerTemplate.tsx
│   │   │   │   ├── StudentListManager.tsx
│   │   │   │   ├── ExportPlayerDialog.tsx
│   │   │   │   ├── QuestionList.tsx
│   │   │   │   └── ui/                # shadcn/ui components
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── QuizEditor.tsx
│   │   │   │   ├── ReceiveMode.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useQuizzes.ts
│   │   │   │   ├── useQuestions.ts
│   │   │   │   ├── useStudents.ts
│   │   │   │   └── useResults.ts
│   │   │   ├── lib/
│   │   │   │   ├── queryClient.ts
│   │   │   │   └── utils.ts
│   │   │   ├── router.ts
│   │   │   ├── store/
│   │   │   │   └── appStore.ts
│   │   │   └── main.tsx
│   │   └── src-tauri/
│   │       └── src/
│   │           ├── commands/
│   │           │   ├── quiz_commands.rs
│   │           │   ├── question_commands.rs
│   │           │   ├── media_commands.rs
│   │           │   ├── student_commands.rs
│   │           │   ├── network_commands.rs
│   │           │   └── result_commands.rs
│   │           ├── database/
│   │           │   ├── schema.rs
│   │           │   └── migrations/
│   │           ├── models/
│   │           ├── export/
│   │           │   ├── quiz_file.rs    # .qfz packaging
│   │           │   └── player_bundle.rs # .exe generation
│   │           ├── network/
│   │           │   ├── lan_server.rs
│   │           │   └── mdns.rs
│   │           ├── error.rs
│   │           └── main.rs
│   │
│   └── player/
│       ├── src/
│       │   ├── components/
│       │   │   └── player/
│       │   │       ├── questions/     # 10 question players
│       │   │       ├── QuizIntro.tsx
│       │   │       ├── QuizScreen.tsx
│       │   │       ├── QuizOutline.tsx
│       │   │       ├── QuizTimer.tsx
│       │   │       └── QuizResult.tsx
│       │   ├── hooks/
│       │   │   ├── useKeyboardNavigation.ts
│       │   │   └── useQuizPlayer.ts
│       │   ├── store/
│       │   │   └── playerStore.ts
│       │   └── main.tsx
│       └── src-tauri/
│           └── src/
│               ├── commands/
│               │   ├── quiz_loader.rs  # decrypt + parse quiz.dat
│               │   ├── validate.rs     # answer validation (Rust only)
│               │   └── network.rs      # result submission
│               ├── security/
│               │   ├── mutex.rs        # single instance
│               │   └── crypto.rs       # AES-256-GCM
│               └── main.rs
│
├── packages/
│   ├── types/
│   │   ├── src/
│   │   │   ├── quiz.ts        # Full Zod schemas (above)
│   │   │   ├── result.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── ui/
│   │   ├── src/               # Shared React components
│   │   └── package.json
│   └── quiz-engine/
│       ├── src/
│       │   ├── scoring.ts     # Shared scoring logic
│       │   ├── validation.ts  # Client-side pre-validation
│       │   └── index.ts
│       └── package.json
│
└── tools/
    └── player-bundler/
        ├── nsis-template.nsi
        ├── scripts/
        │   └── bundle.ps1
        └── resources/
            └── MicrosoftEdgeWebview2Setup.exe
```

---

## AGENT: START HERE

Execute in this exact order:

1. `STEP_01`: Create monorepo scaffold (pnpm workspace + turbo)
2. `STEP_02`: Create `packages/types` with full Zod schemas from Phase 0
3. `STEP_03`: Scaffold Creator Tauri app with all dependencies
4. `STEP_04`: Implement SQLite schema + migrations
5. `STEP_05`: Implement all Rust commands (quiz CRUD)
6. `STEP_06`: Setup TanStack Router + Query in Creator frontend
7. `STEP_07`: Build Dashboard page
8. `STEP_08`: Build Quiz Editor page with QuestionList (TanStack Table)
9. `STEP_09`: Build all 10 question editor components
10. `STEP_10`: Build Quiz Properties modal (5 tabs)
11. `STEP_11`: Build Player Template editor
12. `STEP_12`: Build Student List Manager + Excel import
13. `STEP_13`: Implement .qfz export/import in Rust
14. `STEP_14`: Build Player Shell app
15. `STEP_15`: Implement answer validation in Rust (Player)
16. `STEP_16`: Implement keyboard navigation
17. `STEP_17`: Implement result submission (HTTP + LAN)
18. `STEP_18`: Implement player bundle export (NSIS)
19. `STEP_19`: Implement LAN receiver in Creator
20. `STEP_20`: Implement auto-updater
21. `STEP_21`: Security hardening (devtools disable, mutex)
22. `STEP_22`: Write tests
23. `STEP_23`: CI/CD setup
```
