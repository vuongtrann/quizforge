import { describe, it, expect } from 'vitest'
import {
    TrueFalseQuestionSchema,
    MultipleChoiceQuestionSchema,
    FillInBlankQuestionSchema,
    ThemeSchema,
    QuizSchema,
    BaseQuestionSchema,
    MultipleResponseQuestionSchema,
    SequenceQuestionSchema,
    MatchingQuestionSchema,
} from './quiz'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const baseQuestion = {
    id: '00000000-0000-0000-0000-000000000001',
    text: 'Sample question text',
    points: { correct: 10, incorrect: 0 },
    feedback: { correct: 'Chính xác !', incorrect: 'Không chính xác !' },
    feedbackMode: 'by_question' as const,
    attempts: 1,
    order: 1,
    timeLimit: 0,
    autoNext: false,
}

const sampleOption = (id: string, isCorrect: boolean) => ({
    id,
    text: 'An option',
    isCorrect,
})

// ─── TrueFalseQuestionSchema ──────────────────────────────────────────────────

describe('TrueFalseQuestionSchema', () => {
    it('parses valid true/false question', () => {
        const input = {
            ...baseQuestion,
            type: 'true_false',
            correctAnswer: 'true',
        }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.type).toBe('true_false')
            expect(result.data.correctAnswer).toBe('true')
        }
    })

    it('parses correctAnswer=false', () => {
        const input = { ...baseQuestion, type: 'true_false', correctAnswer: 'false' }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
    })

    it('fails when correctAnswer is missing', () => {
        const input = { ...baseQuestion, type: 'true_false' }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when correctAnswer is not "true" or "false"', () => {
        const input = { ...baseQuestion, type: 'true_false', correctAnswer: 'yes' }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when id is not a UUID', () => {
        const input = { ...baseQuestion, id: 'not-a-uuid', type: 'true_false', correctAnswer: 'true' }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when text is empty string', () => {
        const input = { ...baseQuestion, text: '', type: 'true_false', correctAnswer: 'true' }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when points.correct is negative', () => {
        const input = {
            ...baseQuestion,
            points: { correct: -1, incorrect: 0 },
            type: 'true_false',
            correctAnswer: 'true',
        }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('applies default feedbackMode when omitted', () => {
        const { feedbackMode: _fm, ...withoutMode } = baseQuestion
        const input = { ...withoutMode, type: 'true_false', correctAnswer: 'true' }
        const result = TrueFalseQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.feedbackMode).toBe('by_question')
        }
    })
})

// ─── MultipleChoiceQuestionSchema ─────────────────────────────────────────────

describe('MultipleChoiceQuestionSchema', () => {
    const validOptions = [
        sampleOption('00000000-0000-0000-0000-000000000011', true),
        sampleOption('00000000-0000-0000-0000-000000000012', false),
    ]

    it('parses valid multiple choice question', () => {
        const input = {
            ...baseQuestion,
            type: 'multiple_choice',
            options: validOptions,
        }
        const result = MultipleChoiceQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.options).toHaveLength(2)
            expect(result.data.shuffleOptions).toBe(false) // default
        }
    })

    it('fails when options array has fewer than 2 items', () => {
        const input = {
            ...baseQuestion,
            type: 'multiple_choice',
            options: [sampleOption('00000000-0000-0000-0000-000000000011', true)],
        }
        const result = MultipleChoiceQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when options is missing', () => {
        const input = { ...baseQuestion, type: 'multiple_choice' }
        const result = MultipleChoiceQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when options exceed 10 items', () => {
        const tooMany = Array.from({ length: 11 }, (_, i) =>
            sampleOption(`00000000-0000-0000-0000-0000000000${String(i).padStart(2, '0')}`, i === 0),
        )
        const input = { ...baseQuestion, type: 'multiple_choice', options: tooMany }
        const result = MultipleChoiceQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('accepts shuffleOptions=true', () => {
        const input = {
            ...baseQuestion,
            type: 'multiple_choice',
            options: validOptions,
            shuffleOptions: true,
        }
        const result = MultipleChoiceQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.shuffleOptions).toBe(true)
        }
    })
})

// ─── FillInBlankQuestionSchema ────────────────────────────────────────────────

describe('FillInBlankQuestionSchema', () => {
    const validBlank = {
        id: '00000000-0000-0000-0000-000000000021',
        position: 0,
        acceptableAnswers: ['Paris'],
        caseSensitive: false,
        trimWhitespace: true,
    }

    it('parses valid fill-in-blank question', () => {
        const input = {
            ...baseQuestion,
            type: 'fill_in_blank',
            templateText: 'The capital is {{blank}}.',
            blanks: [validBlank],
        }
        const result = FillInBlankQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.blanks).toHaveLength(1)
            expect(result.data.blanks[0].acceptableAnswers).toContain('Paris')
        }
    })

    it('fails when blanks array is empty', () => {
        const input = {
            ...baseQuestion,
            type: 'fill_in_blank',
            templateText: 'Something',
            blanks: [],
        }
        const result = FillInBlankQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when templateText is missing', () => {
        const input = {
            ...baseQuestion,
            type: 'fill_in_blank',
            blanks: [validBlank],
        }
        const result = FillInBlankQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails when blank.acceptableAnswers is empty', () => {
        const input = {
            ...baseQuestion,
            type: 'fill_in_blank',
            templateText: 'Test {{blank}}',
            blanks: [{ ...validBlank, acceptableAnswers: [] }],
        }
        const result = FillInBlankQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('applies defaults for caseSensitive and trimWhitespace', () => {
        const { caseSensitive: _cs, trimWhitespace: _tw, ...blankWithoutDefaults } = validBlank
        const input = {
            ...baseQuestion,
            type: 'fill_in_blank',
            templateText: 'Test',
            blanks: [blankWithoutDefaults],
        }
        const result = FillInBlankQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.blanks[0].caseSensitive).toBe(false)
            expect(result.data.blanks[0].trimWhitespace).toBe(true)
        }
    })
})

// ─── ThemeSchema ──────────────────────────────────────────────────────────────

describe('ThemeSchema', () => {
    const validTheme = {
        id: '00000000-0000-0000-0000-000000000031',
        name: 'Default',
        primaryColor: '#ef4444',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        progressStyle: 'bar',
        navigationStyle: 'buttons',
        fontFamily: 'Inter',
        fontSize: 16,
        showTimer: true,
        roundedCorners: true,
    }

    it('parses a valid theme', () => {
        const result = ThemeSchema.safeParse(validTheme)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.primaryColor).toBe('#ef4444')
        }
    })

    it('applies default name when omitted', () => {
        const { name: _n, ...withoutName } = validTheme
        const result = ThemeSchema.safeParse(withoutName)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.name).toBe('Default')
        }
    })

    it('applies default colors when omitted', () => {
        const { primaryColor: _p, backgroundColor: _b, textColor: _t, ...minimal } = validTheme
        const result = ThemeSchema.safeParse(minimal)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.primaryColor).toBe('#ef4444')
            expect(result.data.backgroundColor).toBe('#ffffff')
            expect(result.data.textColor).toBe('#1f2937')
        }
    })

    it('fails when id is not a UUID', () => {
        const result = ThemeSchema.safeParse({ ...validTheme, id: 'bad-id' })
        expect(result.success).toBe(false)
    })

    it('fails with invalid progressStyle', () => {
        const result = ThemeSchema.safeParse({ ...validTheme, progressStyle: 'circle' })
        expect(result.success).toBe(false)
    })

    it('fails with invalid navigationStyle', () => {
        const result = ThemeSchema.safeParse({ ...validTheme, navigationStyle: 'tabs' })
        expect(result.success).toBe(false)
    })

    it('accepts all valid progressStyle values', () => {
        for (const style of ['bar', 'dots', 'number'] as const) {
            const result = ThemeSchema.safeParse({ ...validTheme, progressStyle: style })
            expect(result.success).toBe(true)
        }
    })

    it('accepts all valid navigationStyle values', () => {
        for (const style of ['buttons', 'sidebar', 'floating'] as const) {
            const result = ThemeSchema.safeParse({ ...validTheme, navigationStyle: style })
            expect(result.success).toBe(true)
        }
    })
})

// ─── MultipleResponseQuestionSchema ──────────────────────────────────────────

describe('MultipleResponseQuestionSchema', () => {
    const validOptions = [
        sampleOption('00000000-0000-0000-0000-000000000041', true),
        sampleOption('00000000-0000-0000-0000-000000000042', true),
        sampleOption('00000000-0000-0000-0000-000000000043', false),
    ]

    it('parses valid multiple response question', () => {
        const input = {
            ...baseQuestion,
            type: 'multiple_response',
            options: validOptions,
        }
        const result = MultipleResponseQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.partialScoring).toBe(false) // default
        }
    })

    it('accepts partialScoring=true', () => {
        const input = {
            ...baseQuestion,
            type: 'multiple_response',
            options: validOptions,
            partialScoring: true,
        }
        const result = MultipleResponseQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.partialScoring).toBe(true)
        }
    })

    it('fails with fewer than 2 options', () => {
        const input = {
            ...baseQuestion,
            type: 'multiple_response',
            options: [sampleOption('00000000-0000-0000-0000-000000000041', true)],
        }
        const result = MultipleResponseQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })
})

// ─── SequenceQuestionSchema ───────────────────────────────────────────────────

describe('SequenceQuestionSchema', () => {
    const validItems = [
        { id: '00000000-0000-0000-0000-000000000051', text: 'Step 1', correctOrder: 1 },
        { id: '00000000-0000-0000-0000-000000000052', text: 'Step 2', correctOrder: 2 },
    ]

    it('parses valid sequence question', () => {
        const input = {
            ...baseQuestion,
            type: 'sequence',
            items: validItems,
        }
        const result = SequenceQuestionSchema.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.items).toHaveLength(2)
        }
    })

    it('fails with fewer than 2 items', () => {
        const input = {
            ...baseQuestion,
            type: 'sequence',
            items: [validItems[0]],
        }
        const result = SequenceQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })

    it('fails with more than 10 items', () => {
        const tooMany = Array.from({ length: 11 }, (_, i) => ({
            id: `00000000-0000-0000-0000-000000000${String(50 + i).padStart(3, '0')}`,
            text: `Step ${i + 1}`,
            correctOrder: i + 1,
        }))
        const input = { ...baseQuestion, type: 'sequence', items: tooMany }
        const result = SequenceQuestionSchema.safeParse(input)
        expect(result.success).toBe(false)
    })
})
