import { z } from 'zod'
import { QuestionTypeSchema } from './quiz'

// ─────────────────────────────────────────────────
// QUESTION RESULT (individual question answer)
// ─────────────────────────────────────────────────

export const QuestionResultSchema = z.object({
    questionId: z.string().uuid(),
    questionType: QuestionTypeSchema,
    studentAnswer: z.unknown(),
    isCorrect: z.boolean().optional(), // null for short_essay (needs manual grade)
    pointsEarned: z.number(),
    timeSpentSeconds: z.number(),
})
export type QuestionResult = z.infer<typeof QuestionResultSchema>

// ─────────────────────────────────────────────────
// QUIZ RESULT (full quiz submission)
// ─────────────────────────────────────────────────

export const SubmittedViaSchema = z.enum(['http', 'lan', 'local'])
export type SubmittedVia = z.infer<typeof SubmittedViaSchema>

export const QuizResultSchema = z.object({
    id: z.string().uuid(),
    quizId: z.string().uuid(),
    quizTitle: z.string(),
    studentName: z.string(),
    className: z.string().optional(),
    startedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }),
    timeSpentSeconds: z.number().int().default(0),
    totalPoints: z.number(),
    earnedPoints: z.number(),
    percentage: z.number(),
    passed: z.boolean(),
    questionResults: z.array(QuestionResultSchema),
    machineId: z.string().optional(),
    submittedVia: SubmittedViaSchema.default('local'),
    notes: z.string().optional(),
})
export type QuizResult = z.infer<typeof QuizResultSchema>

// ─────────────────────────────────────────────────
// VALIDATION RESULT (returned from Rust to frontend)
// ─────────────────────────────────────────────────

export const ValidationResultSchema = z.object({
    isCorrect: z.boolean(),
    pointsEarned: z.number(),
    correctFeedback: z.string(),
    incorrectFeedback: z.string(),
    // NEVER includes correct answer — security critical
})
export type ValidationResult = z.infer<typeof ValidationResultSchema>

// ─────────────────────────────────────────────────
// HEARTBEAT (Player → Creator every 10s)
// ─────────────────────────────────────────────────

export const HeartbeatSchema = z.object({
    type: z.literal('heartbeat'),
    quizId: z.string().uuid(),
    studentName: z.string(),
    className: z.string().optional(),
    completionPercent: z.number().min(0).max(100),
    currentQuestion: z.number().int(),
    totalQuestions: z.number().int(),
    tabOutCount: z.number().int().default(0),
    windowFocused: z.boolean(),
    timestamp: z.string().datetime({ offset: true }),
})
export type Heartbeat = z.infer<typeof HeartbeatSchema>

// ─────────────────────────────────────────────────
// TAB OUT EVENT (immediate alert)
// ─────────────────────────────────────────────────

export const TabOutEventSchema = z.object({
    type: z.literal('tab_out_event'),
    studentName: z.string(),
    timestamp: z.string().datetime({ offset: true }),
    tabOutCount: z.number().int(),
})
export type TabOutEvent = z.infer<typeof TabOutEventSchema>

// ─────────────────────────────────────────────────
// MONITOR DATA (for Creator Dashboard Tab 2)
// ─────────────────────────────────────────────────

export const StudentStatusSchema = z.enum([
    'waiting',   // Chờ
    'working',   // Đang làm
    'tab_out',   // ⚠️ TAB ra
    'submitted', // ✅ Đã nộp
    'lost',      // 🔴 Mất kết nối (timeout >30s)
])
export type StudentStatus = z.infer<typeof StudentStatusSchema>

export const MonitorStudentSchema = z.object({
    studentName: z.string(),
    className: z.string().optional(),
    ipAddress: z.string(),
    completionPercent: z.number(),
    currentQuestion: z.number().int(),
    totalQuestions: z.number().int(),
    score: z.number().optional(), // null until submitted
    status: StudentStatusSchema,
    tabOutCount: z.number().int().default(0),
    lastSeen: z.string().datetime({ offset: true }),
})
export type MonitorStudent = z.infer<typeof MonitorStudentSchema>

// ─────────────────────────────────────────────────
// LAN SERVER INFO (discovery result)
// ─────────────────────────────────────────────────

export const ServerInfoSchema = z.object({
    ip: z.string(),
    port: z.number().int(),
    name: z.string().optional(),
})
export type ServerInfo = z.infer<typeof ServerInfoSchema>

// ─────────────────────────────────────────────────
// EXPORT RESULT (from export player command)
// ─────────────────────────────────────────────────

export const ExportResultSchema = z.object({
    outputPath: z.string(),
    fileSizeBytes: z.number().int(),
    exportDurationMs: z.number().int(),
})
export type ExportResult = z.infer<typeof ExportResultSchema>

// ─────────────────────────────────────────────────
// APP SETTINGS
// ─────────────────────────────────────────────────

export const AppSettingsSchema = z.object({
    resultServerUrl: z.string().default(''),
    lanPort: z.number().int().default(41235),
    heartbeatPort: z.number().int().default(41236),
    autoUpdate: z.boolean().default(true),
    updateEndpoint: z.string().default(''),
    theme: z.enum(['light']).default('light'), // dark not supported yet
    language: z.enum(['vi']).default('vi'),    // Vietnamese only Phase 1
    defaultPassingRate: z.number().default(95),
    defaultPointsCorrect: z.number().int().default(10),
    defaultPointsIncorrect: z.number().int().default(0),
    defaultFeedbackCorrect: z.string().default('Chính xác !'),
    defaultFeedbackIncorrect: z.string().default('Không chính xác !'),
    mediaMaxSizeMb: z.number().int().default(50),
    brandingOrgName: z.string().default(''),
    brandingWebsite: z.string().default(''),
    brandingAppName: z.string().default('QuizForge Creator'),
    brandingBgColor: z.string().default('#eff6ff'),
})
export type AppSettings = z.infer<typeof AppSettingsSchema>
