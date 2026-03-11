import { describe, it, expect } from 'vitest'
import {
    scoreTrueFalse,
    scoreMultipleChoice,
    scoreMultipleResponse,
    scoreFillInBlank,
    scoreSequence,
    scoreMatching,
    calculateTotalPoints,
    calculatePercentage,
    isPassed,
    formatTime,
} from './scoring'
import type {
    TrueFalseQuestion,
    MultipleChoiceQuestion,
    MultipleResponseQuestion,
    FillInBlankQuestion,
    SequenceQuestion,
    MatchingQuestion,
    Question,
} from '@quizforge/types'

// ─── Shared base fields ───────────────────────────────────────────────────────

const baseFields = {
    id: '00000000-0000-0000-0000-000000000001',
    text: 'Sample question',
    points: { correct: 10, incorrect: 0 },
    feedback: { correct: 'Chính xác !', incorrect: 'Không chính xác !' },
    feedbackMode: 'by_question' as const,
    attempts: 1,
    order: 1,
}

// ─── scoreTrueFalse ───────────────────────────────────────────────────────────

describe('scoreTrueFalse', () => {
    const question: TrueFalseQuestion = {
        ...baseFields,
        type: 'true_false',
        correctAnswer: 'true',
    }

    it('correct answer returns max points and isCorrect=true', () => {
        const result = scoreTrueFalse(question, 'true')
        expect(result.isCorrect).toBe(true)
        expect(result.pointsEarned).toBe(10)
        expect(result.maxPoints).toBe(10)
    })

    it('wrong answer returns incorrect points and isCorrect=false', () => {
        const result = scoreTrueFalse(question, 'false')
        expect(result.isCorrect).toBe(false)
        expect(result.pointsEarned).toBe(0)
        expect(result.incorrectPoints).toBe(0)
    })

    it('null answer returns isCorrect=false', () => {
        const result = scoreTrueFalse(question, null)
        expect(result.isCorrect).toBe(false)
        expect(result.pointsEarned).toBe(0)
    })

    it('uses custom incorrectPoints when set', () => {
        const q: TrueFalseQuestion = {
            ...question,
            points: { correct: 10, incorrect: -2 },
        }
        const result = scoreTrueFalse(q, 'false')
        expect(result.pointsEarned).toBe(-2)
    })
})

// ─── scoreMultipleChoice ──────────────────────────────────────────────────────

describe('scoreMultipleChoice', () => {
    const correctId = 'opt-correct-0000-0000-000000000001'
    const wrongId = 'opt-wrong-000-0000-0000-000000000002'

    const question: MultipleChoiceQuestion = {
        ...baseFields,
        type: 'multiple_choice',
        shuffleOptions: false,
        options: [
            { id: correctId, text: 'Correct answer', isCorrect: true },
            { id: wrongId, text: 'Wrong answer', isCorrect: false },
        ],
    }

    it('correct option ID returns full points', () => {
        const result = scoreMultipleChoice(question, correctId)
        expect(result.isCorrect).toBe(true)
        expect(result.pointsEarned).toBe(10)
    })

    it('wrong option ID returns incorrect points', () => {
        const result = scoreMultipleChoice(question, wrongId)
        expect(result.isCorrect).toBe(false)
        expect(result.pointsEarned).toBe(0)
    })

    it('null answer returns incorrect', () => {
        const result = scoreMultipleChoice(question, null)
        expect(result.isCorrect).toBe(false)
        expect(result.pointsEarned).toBe(0)
    })
})

// ─── scoreMultipleResponse ────────────────────────────────────────────────────

describe('scoreMultipleResponse', () => {
    const idA = 'mropt-a000-0000-0000-000000000001'
    const idB = 'mropt-b000-0000-0000-000000000002'
    const idC = 'mropt-c000-0000-0000-000000000003'
    const idW = 'mropt-w000-0000-0000-000000000004'

    const baseQ: MultipleResponseQuestion = {
        ...baseFields,
        type: 'multiple_response',
        shuffleOptions: false,
        partialScoring: false,
        options: [
            { id: idA, text: 'A', isCorrect: true },
            { id: idB, text: 'B', isCorrect: true },
            { id: idC, text: 'C', isCorrect: true },
            { id: idW, text: 'Wrong', isCorrect: false },
        ],
    }

    describe('without partialScoring (all-or-nothing)', () => {
        it('all correct, none wrong → full points, isCorrect=true', () => {
            const result = scoreMultipleResponse(baseQ, [idA, idB, idC])
            expect(result.isCorrect).toBe(true)
            expect(result.pointsEarned).toBe(10)
        })

        it('missing one correct → isCorrect=false, incorrect points', () => {
            const result = scoreMultipleResponse(baseQ, [idA, idB])
            expect(result.isCorrect).toBe(false)
            expect(result.pointsEarned).toBe(0)
        })

        it('including a wrong option → isCorrect=false', () => {
            const result = scoreMultipleResponse(baseQ, [idA, idB, idC, idW])
            expect(result.isCorrect).toBe(false)
            expect(result.pointsEarned).toBe(0)
        })

        it('empty selection → isCorrect=false', () => {
            const result = scoreMultipleResponse(baseQ, [])
            expect(result.isCorrect).toBe(false)
            expect(result.pointsEarned).toBe(0)
        })
    })

    describe('with partialScoring=true', () => {
        const partialQ: MultipleResponseQuestion = { ...baseQ, partialScoring: true }

        it('all correct, no wrong → full points, isCorrect=true', () => {
            const result = scoreMultipleResponse(partialQ, [idA, idB, idC])
            expect(result.isCorrect).toBe(true)
            expect(result.pointsEarned).toBe(10)
        })

        it('2 out of 3 correct, no wrong → partial points', () => {
            // (2 - 0) / 3 * 10 = 6.67 → rounds to 7
            const result = scoreMultipleResponse(partialQ, [idA, idB])
            expect(result.isCorrect).toBe(false)
            expect(result.pointsEarned).toBe(7)
        })

        it('1 correct, 1 wrong → penalty reduces score', () => {
            // (1 - 1) / 3 * 10 = 0
            const result = scoreMultipleResponse(partialQ, [idA, idW])
            expect(result.isCorrect).toBe(false)
            expect(result.pointsEarned).toBe(0)
        })

        it('all wrong → 0 points', () => {
            const result = scoreMultipleResponse(partialQ, [idW])
            expect(result.isCorrect).toBe(false)
            expect(result.pointsEarned).toBe(0)
        })

        it('more wrong than correct → clamped to 0', () => {
            // (0 - 1) / 3 * 10 = -3.33 → Math.max(0, ...) = 0
            const result = scoreMultipleResponse(partialQ, [idW])
            expect(result.pointsEarned).toBeGreaterThanOrEqual(0)
        })
    })
})

// ─── scoreFillInBlank ─────────────────────────────────────────────────────────

describe('scoreFillInBlank', () => {
    const blankId1 = '00000000-0000-0000-0000-000000000011'
    const blankId2 = '00000000-0000-0000-0000-000000000012'

    const question: FillInBlankQuestion = {
        ...baseFields,
        type: 'fill_in_blank',
        templateText: 'The capital of France is {{blank1}}.',
        blanks: [
            {
                id: blankId1,
                position: 0,
                acceptableAnswers: ['Paris', 'paris'],
                caseSensitive: false,
                trimWhitespace: true,
            },
        ],
    }

    it('all blanks correct → full points', () => {
        const result = scoreFillInBlank(question, { [blankId1]: 'Paris' })
        expect(result.isCorrect).toBe(true)
        expect(result.pointsEarned).toBe(10)
    })

    it('wrong answer → isCorrect=false', () => {
        const result = scoreFillInBlank(question, { [blankId1]: 'London' })
        expect(result.isCorrect).toBe(false)
        expect(result.pointsEarned).toBe(0)
    })

    it('case insensitive matching works', () => {
        const result = scoreFillInBlank(question, { [blankId1]: 'PARIS' })
        expect(result.isCorrect).toBe(true)
    })

    it('trimWhitespace trims leading/trailing spaces', () => {
        const result = scoreFillInBlank(question, { [blankId1]: '  Paris  ' })
        expect(result.isCorrect).toBe(true)
    })

    it('caseSensitive=true rejects wrong case', () => {
        const strictQ: FillInBlankQuestion = {
            ...question,
            blanks: [
                {
                    id: blankId1,
                    position: 0,
                    acceptableAnswers: ['Paris'],
                    caseSensitive: true,
                    trimWhitespace: true,
                },
            ],
        }
        const result = scoreFillInBlank(strictQ, { [blankId1]: 'paris' })
        expect(result.isCorrect).toBe(false)
    })

    it('trimWhitespace=false preserves spaces', () => {
        const noTrimQ: FillInBlankQuestion = {
            ...question,
            blanks: [
                {
                    id: blankId1,
                    position: 0,
                    acceptableAnswers: ['Paris'],
                    caseSensitive: false,
                    trimWhitespace: false,
                },
            ],
        }
        // With spaces and no trimming, should not match "Paris"
        const result = scoreFillInBlank(noTrimQ, { [blankId1]: ' Paris ' })
        expect(result.isCorrect).toBe(false)
    })

    it('multiple blanks: one wrong → isCorrect=false', () => {
        const multiQ: FillInBlankQuestion = {
            ...question,
            templateText: '{{b1}} and {{b2}}',
            blanks: [
                {
                    id: blankId1,
                    position: 0,
                    acceptableAnswers: ['Paris'],
                    caseSensitive: false,
                    trimWhitespace: true,
                },
                {
                    id: blankId2,
                    position: 1,
                    acceptableAnswers: ['France'],
                    caseSensitive: false,
                    trimWhitespace: true,
                },
            ],
        }
        const result = scoreFillInBlank(multiQ, {
            [blankId1]: 'Paris',
            [blankId2]: 'Germany',
        })
        expect(result.isCorrect).toBe(false)
    })

    it('missing blank answer defaults to empty string and fails', () => {
        const result = scoreFillInBlank(question, {})
        expect(result.isCorrect).toBe(false)
    })
})

// ─── scoreSequence ────────────────────────────────────────────────────────────

describe('scoreSequence', () => {
    const id1 = '00000000-0000-0000-0000-000000000021'
    const id2 = '00000000-0000-0000-0000-000000000022'
    const id3 = '00000000-0000-0000-0000-000000000023'

    const question: SequenceQuestion = {
        ...baseFields,
        type: 'sequence',
        partialScoring: false,
        items: [
            { id: id1, text: 'First', correctOrder: 1 },
            { id: id2, text: 'Second', correctOrder: 2 },
            { id: id3, text: 'Third', correctOrder: 3 },
        ],
    }

    it('correct order → full points, isCorrect=true', () => {
        const result = scoreSequence(question, [id1, id2, id3])
        expect(result.isCorrect).toBe(true)
        expect(result.pointsEarned).toBe(10)
    })

    it('wrong order → isCorrect=false, incorrect points', () => {
        const result = scoreSequence(question, [id3, id2, id1])
        expect(result.isCorrect).toBe(false)
        expect(result.pointsEarned).toBe(0)
    })

    it('partially correct order → isCorrect=false', () => {
        const result = scoreSequence(question, [id1, id3, id2])
        expect(result.isCorrect).toBe(false)
    })

    it('empty answer → isCorrect=false', () => {
        const result = scoreSequence(question, [])
        expect(result.isCorrect).toBe(false)
    })

    it('maxPoints and incorrectPoints are returned correctly', () => {
        const result = scoreSequence(question, [id1, id2, id3])
        expect(result.maxPoints).toBe(10)
        expect(result.incorrectPoints).toBe(0)
    })
})

// ─── scoreMatching ────────────────────────────────────────────────────────────

describe('scoreMatching', () => {
    const pairId1 = '00000000-0000-0000-0000-000000000031'
    const pairId2 = '00000000-0000-0000-0000-000000000032'

    const question: MatchingQuestion = {
        ...baseFields,
        type: 'matching',
        shuffleChoices: false,
        shuffleMatches: false,
        displayMode: 'dragdrop',
        pairs: [
            { id: pairId1, choice: 'Cat', match: 'Meow' },
            { id: pairId2, choice: 'Dog', match: 'Woof' },
        ],
    }

    // The scoring implementation checks: studentPairs[pair.id] === pair.id
    // This means a "correct" submission maps each pairId to itself.
    it('correct pairs → full points, isCorrect=true', () => {
        const correctAnswer = {
            [pairId1]: pairId1,
            [pairId2]: pairId2,
        }
        const result = scoreMatching(question, correctAnswer)
        expect(result.isCorrect).toBe(true)
        expect(result.pointsEarned).toBe(10)
    })

    it('wrong pairing → isCorrect=false', () => {
        const wrongAnswer = {
            [pairId1]: pairId2,
            [pairId2]: pairId1,
        }
        const result = scoreMatching(question, wrongAnswer)
        expect(result.isCorrect).toBe(false)
        expect(result.pointsEarned).toBe(0)
    })

    it('empty answer → isCorrect=false', () => {
        const result = scoreMatching(question, {})
        expect(result.isCorrect).toBe(false)
    })

    it('maxPoints is returned correctly', () => {
        const result = scoreMatching(question, { [pairId1]: pairId1, [pairId2]: pairId2 })
        expect(result.maxPoints).toBe(10)
    })
})

// ─── calculateTotalPoints ─────────────────────────────────────────────────────

describe('calculateTotalPoints', () => {
    const makeTF = (pts: number, order: number): Question => ({
        ...baseFields,
        id: `00000000-0000-0000-0000-0000000000${order}0`,
        type: 'true_false',
        correctAnswer: 'true',
        points: { correct: pts, incorrect: 0 },
        order,
    })

    it('sums points across all non-blank questions', () => {
        const questions: Question[] = [makeTF(10, 1), makeTF(20, 2), makeTF(5, 3)]
        expect(calculateTotalPoints(questions)).toBe(35)
    })

    it('excludes blank_page questions', () => {
        const blank: Question = {
            ...baseFields,
            id: '00000000-0000-0000-0000-000000000099',
            type: 'blank_page',
            title: 'Info',
            content: '<p>Hello</p>',
            showTimer: false,
            points: { correct: 99, incorrect: 0 },
            order: 99,
        }
        const questions: Question[] = [makeTF(10, 1), blank]
        expect(calculateTotalPoints(questions)).toBe(10)
    })

    it('returns 0 for empty array', () => {
        expect(calculateTotalPoints([])).toBe(0)
    })
})

// ─── calculatePercentage ──────────────────────────────────────────────────────

describe('calculatePercentage', () => {
    it('calculates percentage with 1 decimal', () => {
        expect(calculatePercentage(7, 10)).toBe(70)
        expect(calculatePercentage(1, 3)).toBe(33.3)
    })

    it('returns 0 when total is 0', () => {
        expect(calculatePercentage(0, 0)).toBe(0)
    })

    it('returns 100 for perfect score', () => {
        expect(calculatePercentage(10, 10)).toBe(100)
    })
})

// ─── isPassed ─────────────────────────────────────────────────────────────────

describe('isPassed', () => {
    it('passes when percentage >= passingRate', () => {
        expect(isPassed(95, 95)).toBe(true)
        expect(isPassed(100, 80)).toBe(true)
    })

    it('fails when percentage < passingRate', () => {
        expect(isPassed(79, 80)).toBe(false)
        expect(isPassed(0, 50)).toBe(false)
    })
})

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
    it('formats seconds under an hour as mm:ss', () => {
        expect(formatTime(0)).toBe('00:00')
        expect(formatTime(61)).toBe('01:01')
        expect(formatTime(599)).toBe('09:59')
        expect(formatTime(3599)).toBe('59:59')
    })

    it('formats seconds >= 3600 as hh:mm:ss', () => {
        expect(formatTime(3600)).toBe('01:00:00')
        expect(formatTime(3661)).toBe('01:01:01')
        expect(formatTime(7384)).toBe('02:03:04')
    })

    it('pads single digits with leading zero', () => {
        expect(formatTime(5)).toBe('00:05')
        expect(formatTime(65)).toBe('01:05')
    })
})
