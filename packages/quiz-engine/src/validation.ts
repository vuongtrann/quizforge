import type {
    Question,
} from '@quizforge/types'

/**
 * Check if a question has been answered sufficiently to proceed/submit.
 */
export function isQuestionAnswered(
    question: Question,
    studentAnswer: any,
): boolean {
    switch (question.type) {
        case 'true_false':
            return studentAnswer !== null && studentAnswer !== undefined

        case 'multiple_choice':
            return !!studentAnswer // Expecting a string ID

        case 'multiple_response':
            return Array.isArray(studentAnswer) && studentAnswer.length > 0

        case 'fill_in_blank':
            if (!studentAnswer || typeof studentAnswer !== 'object') return false
            return Object.values(studentAnswer).some(val => !!val)

        case 'matching':
            if (!studentAnswer || typeof studentAnswer !== 'object') return false
            return Object.keys(studentAnswer).length > 0

        case 'sequence':
            return Array.isArray(studentAnswer) && studentAnswer.length === (question as any).items.length

        case 'word_bank':
            if (!studentAnswer || typeof studentAnswer !== 'object') return false
            return Object.keys(studentAnswer).length > 0

        case 'click_map':
            return Array.isArray(studentAnswer) && studentAnswer.length > 0

        case 'short_essay':
            return !!studentAnswer && String(studentAnswer).trim().length > 0

        case 'blank_page':
            return true // Always "answered"

        default:
            return false
    }
}
