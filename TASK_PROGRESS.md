# QuizForge — Ultra-Detailed Task Tracker
Extracted from MASTER_SPEC.md (1561 lines) + AGENT_SPEC_V2.md (1538 lines)

## Phase 0: Project Scaffold

**STEP_01: Monorepo Scaffold**
- [x] Init root `package.json` with pnpm
- [x] Install devDeps: turbo, typescript, @types/node
- [x] Create `pnpm-workspace.yaml` (apps/, packages/, tools/*)
- [x] Create `turbo.json` with pipeline: build, tauri, dev, typecheck, test
- [x] Create `tsconfig.base.json` shared TypeScript config
- [x] Create `.gitignore`
- [x] Create directory structure: `apps/`, `packages/types/`, `packages/ui/`, `packages/quiz-engine/`, `tools/`
- [x] Create `.github/workflows/` directory

**STEP_02: Shared Types Package (`packages/types`)**
- [x] `packages/types/package.json` + `tsconfig.json`
- [x] `packages/types/src/index.ts` — barrel export
- [x] `packages/types/src/quiz.ts` — Full Zod schemas:
  - [x] QuestionTypeSchema (10 enum values)
  - [x] MediaSchema (id, type, filename, mimeType, data, width, height)
  - [x] FeedbackSchema (correct/incorrect defaults in Vietnamese)
  - [x] BaseQuestionsSchema (id, type, text, richText, media, points, feedback, attempts, branching, group, order)
  - [x] TrueFalseQuestionsSchema (correctAnswer: true/false)
  - [x] MultipleChoiceOptionsSchema (id, text, isCorrect, feedback, media)
  - [x] MultipleChoiceQuestionSchema (options 2-10, shuffleOptions)
  - [x] MultipleResponseQuestionSchema (options, shuffleOptions, partialScoring)
  - [x] BlankSchema (id, position, acceptableAnswers, caseSensitive, trimWhitespace)
  - [x] FillInBlankQuestionSchema (templateText, blanks)
  - [x] MatchingPairSchema (id, choice, choiceMedia, match, matchMedia)
  - [x] MatchingQuestionSchema (pairs 2-10, shuffleChoices, shuffleMatches)
  - [x] SequenceItemSchema (id, text, media, correctOrder)
  - [x] SequenceQuestionSchema (items 2-10, horizontalLayout)
  - [x] WordBankOptionSchema (id, text, isDistractor)
  - [x] WordBankQuestionSchema (templateText, options)
  - [x] HotspotSchema (id, shape, coords, isCorrect, feedback)
  - [x] ClickMapQuestionSchema (imageMediaId, hotspots 1-20, clickLimit)
  - [x] ShortEssayQuestionSchema (minLength, maxLength, evaluationGuide, sampleAnswer)
  - [x] BlankPageSchema (layout, backgroundMediaId)
  - [x] ResultSettingsSchema (showScore, showAnswers, showFeedback, passPercentage)
  - [x] QuizThemeSchema (primaryColor, fontBase, borderRadius)
  - [x] AppSettingsSchema (resultServerUrl, lanReceivePort, autoUpdateEnabled)

**STEP_03: Creator Tauri Setup**
- [x] Setup React + TypeScript inside `apps/creator` using Tauri Vite Template
- [x] Config `tauri.conf.json`, adjust OS Window properties (width, csp, plugin config)
- [x] Dependencies added: Lucide, Tailwind, Radix-ui/shadcn equivalents
- [x] Installed `sql_plugin`, `updater`, `dialog` and other filesystem integrations

**STEP_04: Database initialization**
- [x] Configured SQLite setup with `tauri-plugin-sql`
- [x] Ran schema creation scripts in `src-tauri/src/database` to create `quizzes`, `questions`, etc tables
- [x] Verified migrations run successfully on startup

**STEP_05: Rust Commands (Quiz CRUD)**
- [x] Backend logic defined in `quiz_commands.rs` mapped natively to frontend commands
- [x] Registered specific functions successfully (`get_all_quizzes`, `update_quiz`)

**STEP_06: Routing & App Context State**
- [x] Initialized `appStore` using zustand
- [x] Implemented React Query (`queryClient.ts`) to handle Tauri frontend requests securely
- [x] Initialized `<RouterProvider>` utilizing TanStack Router logic for screen navigation

**STEP_07: Dashboard Assembly**
- [x] Global CSS `index.css` definitions synced correctly with UI specifics for borders, shadows and colors
- [x] Sidebar logic + Routing integrated
- [x] Build `WelcomeScreen.tsx` static view
- [x] Build Monitor modes functionality representation table mapped to `D1/D2` layout

**STEP_08: Quiz Editor Page**
- [x] Implemented Title bar / Status Bar natively
- [x] Ribbon menu Toolbar implementation with correct routing states
- [x] Quiz structure layout mapped seamlessly with `QuestionList` (Grid rows)

## Phase 1: Question Editors & Properties (Next Steps)

**STEP_09: Question Editor Components**
- [x] Create `QuestionEditorDialog.tsx` container (~431 lines, đã implement thật)
- [x] Implement True/False editor
- [x] Implement Multiple Choice (MC) editor
- [x] Implement Multiple Response (MR) editor
- [x] Implement Fill in Blank (FITB) editor
- [x] Implement Matching editor
- [x] Implement Sequence editor
- [x] Implement Word Bank editor
- [x] Implement Click Map (Hotspot) editor
- [x] Implement Short Essay editor
- [x] Implement Blank Page editor

**STEP_10: Quiz Properties Modal**
- [x] Implement General Tab
- [x] Implement Question Tab (defaults)
- [x] Implement Result Tab
- [x] Implement Information Tab
- [x] Implement Security/Password Tab
