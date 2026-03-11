/**
 * QuizForge Quiz Engine — Shared scoring & validation logic
 * Used by both Creator (preview) and Player (actual scoring via Rust)
 */

import type {
    Question,
    TrueFalseQuestion,
    MultipleChoiceQuestion,
    MultipleResponseQuestion,
    FillInBlankQuestion,
    MatchingQuestion,
    SequenceQuestion,
    WordBankQuestion,
    ClickMapQuestion,
    ShortEssayQuestion,
} from '@quizforge/types'

// ─────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────

export interface ScoringResult {
    isCorrect: boolean
    pointsEarned: number
    maxPoints: number
    incorrectPoints: number
}

/**
 * Calculate score for True/False.
 */
export function scoreTrueFalse(
    question: TrueFalseQuestion,
    selectedAnswer: 'true' | 'false' | null,
): ScoringResult {
    const maxPoints = question.points.correct
    const incorrectPoints = question.points.incorrect
    const isCorrect = selectedAnswer === question.correctAnswer
    return {
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : incorrectPoints,
        maxPoints,
        incorrectPoints,
    }
}

/**
 * Calculate score for Multiple Choice.
 */
export function scoreMultipleChoice(
    question: MultipleChoiceQuestion,
    selectedOptionId: string | null,
): ScoringResult {
    const maxPoints = question.points.correct
    const incorrectPoints = question.points.incorrect
    const correctOption = question.options.find(o => o.isCorrect)
    const isCorrect = selectedOptionId === correctOption?.id
    return {
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : incorrectPoints,
        maxPoints,
        incorrectPoints,
    }
}

/**
 * Calculate score for Multiple Response with partial scoring.
 * Formula: max(0, (correct_chosen - wrong_chosen) / total_correct * max_points)
 */
export function scoreMultipleResponse(
    question: MultipleResponseQuestion,
    selectedOptionIds: string[],
): ScoringResult {
    const correctOptionIds = question.options
        .filter(o => o.isCorrect)
        .map(o => o.id)
    const totalCorrect = correctOptionIds.length
    const maxPoints = question.points.correct

    if (!question.partialScoring) {
        // All or nothing
        const allCorrectSelected = correctOptionIds.every(id => selectedOptionIds.includes(id))
        const noWrongSelected = selectedOptionIds.every(id => correctOptionIds.includes(id))
        const isCorrect = allCorrectSelected && noWrongSelected
        return {
            isCorrect,
            pointsEarned: isCorrect ? maxPoints : question.points.incorrect,
            maxPoints,
            incorrectPoints: question.points.incorrect,
        }
    }

    // Partial scoring
    const correctChosen = selectedOptionIds.filter(id => correctOptionIds.includes(id)).length
    const wrongChosen = selectedOptionIds.filter(id => !correctOptionIds.includes(id)).length
    const score = Math.max(0, ((correctChosen - wrongChosen) / totalCorrect) * maxPoints)
    const pointsEarned = Math.round(score)
    const isCorrect = correctChosen === totalCorrect && wrongChosen === 0

    return {
        isCorrect,
        pointsEarned,
        maxPoints,
        incorrectPoints: question.points.incorrect,
    }
}

/**
 * Validate a fill-in-the-blank answer.
 */
export function scoreFillInBlank(
    question: FillInBlankQuestion,
    answers: Record<string, string>, // blankId → student answer
): ScoringResult {
    const maxPoints = question.points.correct
    let allCorrect = true

    for (const blank of question.blanks) {
        const studentAnswer = answers[blank.id] ?? ''
        const processed = blank.trimWhitespace ? studentAnswer.trim() : studentAnswer

        const isMatch = blank.acceptableAnswers.some(accepted => {
            const processedAccepted = blank.trimWhitespace ? accepted.trim() : accepted
            if (blank.caseSensitive) {
                return processed === processedAccepted
            }
            return processed.toLowerCase() === processedAccepted.toLowerCase()
        })

        if (!isMatch) {
            allCorrect = false
            break
        }
    }

    return {
        isCorrect: allCorrect,
        pointsEarned: allCorrect ? maxPoints : question.points.incorrect,
        maxPoints,
        incorrectPoints: question.points.incorrect,
    }
}

/**
 * Validate matching pairs.
 */
export function scoreMatching(
    question: MatchingQuestion,
    studentPairs: Record<string, string>, // choiceId → matchId
): ScoringResult {
    const maxPoints = question.points.correct
    const allCorrect = question.pairs.every(
        pair => studentPairs[pair.id] === pair.id // in correct implementation, check pair mapping
    )

    return {
        isCorrect: allCorrect,
        pointsEarned: allCorrect ? maxPoints : question.points.incorrect,
        maxPoints,
        incorrectPoints: question.points.incorrect,
    }
}

/**
 * Validate sequence ordering.
 */
export function scoreSequence(
    question: SequenceQuestion,
    studentOrder: string[], // item IDs in student's order
): ScoringResult {
    const maxPoints = question.points.correct
    const correctOrder = [...question.items]
        .sort((a, b) => a.correctOrder - b.correctOrder)
        .map(item => item.id)

    const isCorrect = studentOrder.length === correctOrder.length &&
        studentOrder.every((id, index) => id === correctOrder[index])

    return {
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : question.points.incorrect,
        maxPoints,
        incorrectPoints: question.points.incorrect,
    }
}

/**
 * Validate word bank answers.
 */
export function scoreWordBank(
    question: WordBankQuestion,
    studentSlots: Record<string, string>, // slotId → wordId
): ScoringResult {
    const maxPoints = question.points.correct
    const allCorrect = question.slots.every(
        slot => studentSlots[slot.id] === slot.correctWordId
    )

    return {
        isCorrect: allCorrect,
        pointsEarned: allCorrect ? maxPoints : question.points.incorrect,
        maxPoints,
        incorrectPoints: question.points.incorrect,
    }
}

/**
 * Validate click map (hotspot) answers.
 */
export function scoreClickMap(
    question: ClickMapQuestion,
    selectedHotspotIds: string[],
): ScoringResult {
    const maxPoints = question.points.correct
    const correctHotspotIds = question.hotspots
        .filter(h => h.isCorrect)
        .map(h => h.id)

    // For now, assume a simple "all correct hotspots must be selected" or "exactly one correct"
    // based on allowMultipleClicks.
    const allCorrectSelected = correctHotspotIds.every(id => selectedHotspotIds.includes(id))
    const noWrongSelected = selectedHotspotIds.every(id => correctHotspotIds.includes(id))
    const isCorrect = allCorrectSelected && noWrongSelected

    return {
        isCorrect,
        pointsEarned: isCorrect ? maxPoints : question.points.incorrect,
        maxPoints,
        incorrectPoints: question.points.incorrect,
    }
}

/**
 * Score short essay (manual grading placeholder).
 */
export function scoreShortEssay(
    question: ShortEssayQuestion,
    _answer: string,
): ScoringResult {
    return {
        isCorrect: false, // Needs manual grading
        pointsEarned: 0,
        maxPoints: question.points.correct,
        incorrectPoints: question.points.incorrect,
    }
}

// ─────────────────────────────────────────────────
// TIMER UTILITIES
// ─────────────────────────────────────────────────

/**
 * Format seconds to mm:ss or hh:mm:ss display.
 */
export function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (n: number) => n.toString().padStart(2, '0')

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }
    return `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Check if timer is in warning zone.
 */
export function isTimerWarning(
    remainingSeconds: number,
    totalSeconds: number,
    warningPercent: number,
): boolean {
    if (totalSeconds === 0) return false
    const remainingPercent = (remainingSeconds / totalSeconds) * 100
    return remainingPercent <= warningPercent
}

// ─────────────────────────────────────────────────
// QUIZ STATS
// ─────────────────────────────────────────────────

export function calculateTotalPoints(questions: Question[]): number {
    return questions
        .filter(q => q.type !== 'blank_page') // Blank pages don't count
        .reduce((sum, q) => sum + q.points.correct, 0)
}

export function countQuestions(questions: Question[]): number {
    return questions.filter(q => q.type !== 'blank_page').length
}

export function calculatePercentage(earned: number, total: number): number {
    if (total === 0) return 0
    return Math.round((earned / total) * 1000) / 10 // 1 decimal place
}

export function isPassed(percentage: number, passingRate: number): boolean {
    return percentage >= passingRate
}
