import { useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'
import type { QuizQuestion } from '../store/playerStore'

export function useKeyboardNavigation() {
    const {
        currentQuestionIndex,
        nextQuestion,
        prevQuestion,
        quiz,
        setAnswer,
        outlinePanelOpen,
        toggleOutline,
        phase,
        finishQuiz,
    } = usePlayerStore()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (phase !== 'quiz') return

            // Don't trigger if typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') {
                    (e.target as HTMLElement).blur()
                }
                return
            }

            const currentQuestion: QuizQuestion | undefined = quiz?.questions?.[currentQuestionIndex]
            const totalQuestions = quiz?.questions?.length || 0

            switch (e.key) {
                case 'ArrowRight':
                    if (currentQuestionIndex < totalQuestions - 1) nextQuestion()
                    break
                case 'ArrowLeft':
                    if (currentQuestionIndex > 0) prevQuestion()
                    break
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) {
                        void finishQuiz()
                    } else if (currentQuestionIndex < totalQuestions - 1) {
                        nextQuestion()
                    }
                    break
                case 'Escape':
                    if (outlinePanelOpen) toggleOutline()
                    break
                case 'm':
                case 'M':
                    toggleOutline()
                    break
                // Number keys for Selection
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    if (currentQuestion && (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false')) {
                        const index = parseInt(e.key) - 1
                        const option = currentQuestion.options?.[index] || (currentQuestion.type === 'true_false' ? (index === 0 ? { id: 'true' } : (index === 1 ? { id: 'false' } : null)) : null)
                        if (option) {
                            setAnswer(currentQuestion.id, option.id)
                        }
                    }
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [phase, currentQuestionIndex, quiz, nextQuestion, prevQuestion, outlinePanelOpen, toggleOutline, setAnswer, finishQuiz])
}
