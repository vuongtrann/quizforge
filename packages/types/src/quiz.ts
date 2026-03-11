import { z } from 'zod'

// ─────────────────────────────────────────────────
// QUESTION TYPES
// ─────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────
// MEDIA
// ─────────────────────────────────────────────────

export const MediaTypeSchema = z.enum(['image', 'audio', 'video'])
export type MediaType = z.infer<typeof MediaTypeSchema>

export const MediaSchema = z.object({
    id: z.string().uuid(),
    type: MediaTypeSchema,
    filename: z.string(),
    mimeType: z.string(),
    data: z.string(), // base64 or file path
    width: z.number().optional(),
    height: z.number().optional(),
})
export type Media = z.infer<typeof MediaSchema>

// ─────────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────────

export const FeedbackModeSchema = z.enum(['by_question', 'by_choice'])
export type FeedbackMode = z.infer<typeof FeedbackModeSchema>

export const FeedbackSchema = z.object({
    correct: z.string().default('Chính xác !'),
    incorrect: z.string().default('Không chính xác !'),
})
export type Feedback = z.infer<typeof FeedbackSchema>

// ─────────────────────────────────────────────────
// BASE QUESTION
// ─────────────────────────────────────────────────

export const BaseQuestionSchema = z.object({
    id: z.string().uuid(),
    type: QuestionTypeSchema,
    text: z.string().min(1, 'Nội dung câu hỏi là bắt buộc'),
    richText: z.string().nullish(), // Tiptap HTML
    media: MediaSchema.nullish(),
    points: z.object({
        correct: z.number().int().min(0).default(10),
        incorrect: z.number().int().default(0),
    }),
    feedback: FeedbackSchema,
    feedbackMode: FeedbackModeSchema.default('by_question'),
    attempts: z.number().int().min(1).default(1),
    branching: z.string().nullish(), // question ID to jump to
    group: z.string().nullish(),
    order: z.number().int(),
    timeLimit: z.number().int().min(0).default(0), // seconds, 0 = no limit
    autoNext: z.boolean().default(false), // auto advance when time up or answered
})

// ─────────────────────────────────────────────────
// TRUE / FALSE
// ─────────────────────────────────────────────────

export const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('true_false'),
    correctAnswer: z.enum(['true', 'false']),
})
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>

// ─────────────────────────────────────────────────
// MULTIPLE CHOICE (single answer)
// ─────────────────────────────────────────────────

export const MultipleChoiceOptionSchema = z.object({
    id: z.string().uuid(),
    text: z.string(),
    isCorrect: z.boolean(),
    feedback: z.string().nullish(), // per-choice feedback
    media: MediaSchema.nullish(),
})
export type MultipleChoiceOption = z.infer<typeof MultipleChoiceOptionSchema>

export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('multiple_choice'),
    options: z.array(MultipleChoiceOptionSchema).min(2).max(10),
    shuffleOptions: z.boolean().default(false),
})
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>

// ─────────────────────────────────────────────────
// MULTIPLE RESPONSE (multiple answers)
// ─────────────────────────────────────────────────

export const MultipleResponseQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('multiple_response'),
    options: z.array(MultipleChoiceOptionSchema).min(2).max(10),
    shuffleOptions: z.boolean().default(false),
    partialScoring: z.boolean().default(false),
    // Partial logic: max(0, (correct_chosen - wrong_chosen) / total_correct * max_points)
})
export type MultipleResponseQuestion = z.infer<typeof MultipleResponseQuestionSchema>

// ─────────────────────────────────────────────────
// FILL IN THE BLANK
// ─────────────────────────────────────────────────

export const BlankSchema = z.object({
    id: z.string().uuid(),
    position: z.number().int(),
    acceptableAnswers: z.array(z.string()).min(1),
    caseSensitive: z.boolean().default(false),
    trimWhitespace: z.boolean().default(true),
})
export type Blank = z.infer<typeof BlankSchema>

export const FillInBlankQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('fill_in_blank'),
    templateText: z.string(), // Text with {{blank_id}} placeholders
    blanks: z.array(BlankSchema).min(1),
})
export type FillInBlankQuestion = z.infer<typeof FillInBlankQuestionSchema>

// ─────────────────────────────────────────────────
// MATCHING
// ─────────────────────────────────────────────────

export const MatchingDisplayModeSchema = z.enum(['dragdrop', 'dropdown'])
export type MatchingDisplayMode = z.infer<typeof MatchingDisplayModeSchema>

export const MatchingPairSchema = z.object({
    id: z.string().uuid(),
    choice: z.string(),
    choiceMedia: MediaSchema.nullish(),
    match: z.string(),
    matchMedia: MediaSchema.nullish(),
})
export type MatchingPair = z.infer<typeof MatchingPairSchema>

export const MatchingQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('matching'),
    pairs: z.array(MatchingPairSchema).min(2).max(10),
    shuffleChoices: z.boolean().default(true),
    shuffleMatches: z.boolean().default(true),
    displayMode: MatchingDisplayModeSchema.default('dragdrop'),
})
export type MatchingQuestion = z.infer<typeof MatchingQuestionSchema>

// ─────────────────────────────────────────────────
// SEQUENCE (ordering)
// ─────────────────────────────────────────────────

export const SequenceItemSchema = z.object({
    id: z.string().uuid(),
    text: z.string(),
    media: MediaSchema.nullish(),
    correctOrder: z.number().int(),
})
export type SequenceItem = z.infer<typeof SequenceItemSchema>

export const SequenceQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('sequence'),
    items: z.array(SequenceItemSchema).min(2).max(10),
    partialScoring: z.boolean().default(false),
})
export type SequenceQuestion = z.infer<typeof SequenceQuestionSchema>

// ─────────────────────────────────────────────────
// WORD BANK
// ─────────────────────────────────────────────────

export const WordBankSlotSchema = z.object({
    id: z.string().uuid(),
    position: z.number().int(),
    correctWordId: z.string().uuid(),
})
export type WordBankSlot = z.infer<typeof WordBankSlotSchema>

export const WordBankWordSchema = z.object({
    id: z.string().uuid(),
    text: z.string(),
    isDistractor: z.boolean().default(false),
})
export type WordBankWord = z.infer<typeof WordBankWordSchema>

export const WordBankQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('word_bank'),
    templateText: z.string(),
    slots: z.array(WordBankSlotSchema).min(1),
    words: z.array(WordBankWordSchema).min(1),
    shuffleWords: z.boolean().default(true),
})
export type WordBankQuestion = z.infer<typeof WordBankQuestionSchema>

// ─────────────────────────────────────────────────
// CLICK MAP (hotspot)
// ─────────────────────────────────────────────────

export const HotspotShapeSchema = z.enum(['rect', 'circle', 'polygon'])
export type HotspotShape = z.infer<typeof HotspotShapeSchema>

export const HotspotSchema = z.object({
    id: z.string().uuid(),
    shape: HotspotShapeSchema,
    // [x, y, w, h] for rect; [cx, cy, r] for circle; [x1,y1,...] for polygon
    coords: z.array(z.number()),
    isCorrect: z.boolean(),
    label: z.string().nullish(),
})
export type Hotspot = z.infer<typeof HotspotSchema>

export const ClickMapQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('click_map'),
    mapImage: MediaSchema,
    hotspots: z.array(HotspotSchema).min(1),
    allowMultipleClicks: z.boolean().default(false),
})
export type ClickMapQuestion = z.infer<typeof ClickMapQuestionSchema>

// ─────────────────────────────────────────────────
// SHORT ESSAY
// ─────────────────────────────────────────────────

export const ShortEssayQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('short_essay'),
    referenceAnswer: z.string().nullish(),
    keywordMatching: z.array(z.string()).default([]),
    maxWords: z.number().int().nullish(),
})
export type ShortEssayQuestion = z.infer<typeof ShortEssayQuestionSchema>

// ─────────────────────────────────────────────────
// BLANK PAGE (info page, not a question)
// ─────────────────────────────────────────────────

export const BlankPageSchema = BaseQuestionSchema.extend({
    type: z.literal('blank_page'),
    title: z.string(),
    content: z.string(), // Rich HTML
    showTimer: z.boolean().default(true),
})
export type BlankPage = z.infer<typeof BlankPageSchema>

// ─────────────────────────────────────────────────
// UNION TYPE — all questions
// ─────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────
// QUIZ SETTINGS
// ─────────────────────────────────────────────────

export const SubmissionModeSchema = z.enum(['per_question', 'all_at_once'])
export type SubmissionMode = z.infer<typeof SubmissionModeSchema>

export const QuizSettingsSchema = z.object({
    passingRate: z.number().min(0).max(100).default(95),
    timeLimit: z.object({
        enabled: z.boolean().default(false),
        durationSeconds: z.number().int().min(60).default(3600),
        warningAtPercent: z.number().min(0).max(100).default(20),
    }),
    randomization: z.object({
        randomizeQuestions: z.boolean().default(false),
        randomCount: z.number().int().nullish(),
        randomizeOptions: z.boolean().default(false),
    }),
    submission: z.object({
        mode: SubmissionModeSchema.default('per_question'),
        showCorrectAfterSubmit: z.boolean().default(true),
        allowReview: z.boolean().default(true),
        oneAttemptOnly: z.boolean().default(false),
        promptResume: z.boolean().default(true),
    }),
    lockdown: z.object({
        enabled: z.boolean().default(false),
        exitCondition: z.enum(['time_up', 'submitted', 'both']).default('both'),
    }),
    email: z.object({
        sendResultsToUser: z.boolean().default(false),
        sendResultsToAdmin: z.boolean().default(false),
        adminEmail: z.string().nullish(),
    }).default({}),
    meta: z.object({
        title: z.string().nullish(),
        description: z.string().nullish(),
        keywords: z.string().nullish(),
    }).default({}),
})
export type QuizSettings = z.infer<typeof QuizSettingsSchema>

// ─────────────────────────────────────────────────
// QUIZ RESULT SETTINGS
// ─────────────────────────────────────────────────

export const QuizResultSettingsSchema = z.object({
    feedbackMode: z.enum(['by_result', 'always']).default('by_result'),
    passMessage: z.string().default('Chúc mừng, bạn đã đạt !'),
    failMessage: z.string().default('Bạn chưa đạt, cố gắng hơn nhé !'),
    showStatisticsOnResult: z.boolean().default(true),
    finishButton: z.object({
        show: z.boolean().default(false),
        passUrl: z.string().url().optional().or(z.literal('')),
        failUrl: z.string().url().optional().or(z.literal('')),
        openInCurrentWindow: z.boolean().default(true),
    }),
})
export type QuizResultSettings = z.infer<typeof QuizResultSettingsSchema>

// ─────────────────────────────────────────────────
// QUIZ INFORMATION
// ─────────────────────────────────────────────────

export const BrandingSchema = z.object({
    logo: z.string().nullish(),
    footerText: z.string().default(''),
    removeBranding: z.boolean().default(false),
    customDomain: z.string().nullish().or(z.literal('')),
    backgroundMode: z.enum(['color', 'gradient', 'image']).default('color'),
    backgroundColor: z.string().default('#f8fafc'),
    backgroundGradient: z.string().default('linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'),
    backgroundImage: z.string().nullish(),
    orgName: z.string().default(''),
    orgWebsite: z.string().default(''),
})

export const QuizInformationSchema = z.object({
    title: z.string().min(1).default('New Quiz'),
    author: z.string().nullish(),
    description: z.string().nullish(),
    introduction: z.object({
        enabled: z.boolean().default(true),
        content: z.string().default(''),
        audioId: z.string().nullish(),
        mediaId: z.string().nullish(),
    }),
    showStatistics: z.boolean().default(true),
    collectParticipantData: z.object({
        enabled: z.boolean().default(false),
        fields: z.array(z.enum(['name', 'email', 'student_id', 'class'])).default([]),
    }),
    branding: BrandingSchema.nullish(),
})
export type QuizInformation = z.infer<typeof QuizInformationSchema>

// ─────────────────────────────────────────────────
// QUIZ SECURITY
// ─────────────────────────────────────────────────

export const ProtectionModeSchema = z.enum(['none', 'password', 'user_id_password'])
export type ProtectionMode = z.infer<typeof ProtectionModeSchema>

export const QuizUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    password: z.string(),
})
export type QuizUser = z.infer<typeof QuizUserSchema>

export const QuizSecuritySchema = z.object({
    protection: ProtectionModeSchema.default('none'),
    password: z.string().nullish(),
    users: z.array(QuizUserSchema).default([]),
    domainRestriction: z.object({
        enabled: z.boolean().default(false),
        domain: z.string().nullish(),
    }),
})
export type QuizSecurity = z.infer<typeof QuizSecuritySchema>

// ─────────────────────────────────────────────────
// THEME (Player Template)
// ─────────────────────────────────────────────────

export const ProgressStyleSchema = z.enum(['bar', 'dots', 'number'])
export type ProgressStyle = z.infer<typeof ProgressStyleSchema>

export const NavigationStyleSchema = z.enum(['buttons', 'sidebar', 'floating'])
export type NavigationStyle = z.infer<typeof NavigationStyleSchema>

export const ThemeSchema = z.object({
    id: z.string().uuid(),
    name: z.string().default('Default'),
    primaryColor: z.string().default('#ef4444'),
    backgroundColor: z.string().default('#ffffff'),
    textColor: z.string().default('#1f2937'),
    progressStyle: ProgressStyleSchema.default('bar'),
    navigationStyle: NavigationStyleSchema.default('buttons'),
    fontFamily: z.string().default('Inter'),
    fontSize: z.number().default(16),
    showTimer: z.boolean().default(true),
    roundedCorners: z.boolean().default(true),
})
export type Theme = z.infer<typeof ThemeSchema>

// ─────────────────────────────────────────────────
// QUIZ — full object
// ─────────────────────────────────────────────────

export const QuizSchema = z.object({
    id: z.string().uuid(),
    schemaVersion: z.string().default('1.0.0'),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    information: QuizInformationSchema,
    settings: QuizSettingsSchema,
    result: QuizResultSettingsSchema,
    security: QuizSecuritySchema,
    theme: ThemeSchema,
    questions: z.array(QuestionSchema),
})
export type Quiz = z.infer<typeof QuizSchema>

// ─────────────────────────────────────────────────
// QUIZ SUMMARY (for dashboard — no questions loaded)
// ─────────────────────────────────────────────────

export const QuizSummarySchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    author: z.string().optional(),
    questionCount: z.number().int(),
    totalPoints: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
})
export type QuizSummary = z.infer<typeof QuizSummarySchema>

// ─────────────────────────────────────────────────
// STUDENT
// ─────────────────────────────────────────────────

export const StudentSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Tên học sinh là bắt buộc'),
    className: z.string().nullish(),
    orderIndex: z.number().int().default(0),
})
export type Student = z.infer<typeof StudentSchema>

export const StudentListSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    importedAt: z.string().datetime({ offset: true }),
    students: z.array(StudentSchema),
})
export type StudentList = z.infer<typeof StudentListSchema>

// ─────────────────────────────────────────────────
// .QFZ MANIFEST
// ─────────────────────────────────────────────────

export const QfzManifestSchema = z.object({
    quizforgeVersion: z.string(),
    schemaVersion: z.string(),
    quizId: z.string().uuid(),
    exportedAt: z.string().datetime({ offset: true }),
    mediaCount: z.number().int(),
    questionCount: z.number().int(),
})
export type QfzManifest = z.infer<typeof QfzManifestSchema>
