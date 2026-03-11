import { usePlayerStore } from '../store/playerStore'

export function MultipleChoicePlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer, feedbackVisible, lastValidationResult } = usePlayerStore()
    const question = quiz?.questions?.[currentQuestionIndex]

    if (!question) return null

    return (
        <div className="space-y-4">
            {question.options?.map((option, index: number) => {
                const isSelected = answers[question.id] === option.id
                const label = String.fromCharCode(65 + index)

                let inlineButtonStyle: React.CSSProperties = { borderRadius: 'var(--qf-radius)' }
                let inlineLabelStyle: React.CSSProperties = { borderRadius: 'calc(var(--qf-radius) - 4px)' }
                let inlineTextStyle: React.CSSProperties = {}

                let buttonClass = ''
                let labelClass = ''
                let textClass = ''

                if (feedbackVisible && isSelected) {
                    if (lastValidationResult?.is_correct) {
                        buttonClass = 'border-green-500 bg-green-50 ring-4 ring-green-500/10 z-10'
                        labelClass = 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-200'
                        textClass = 'text-green-900 font-bold'
                    } else {
                        buttonClass = 'border-red-500 bg-red-50 ring-4 ring-red-500/10 z-10'
                        labelClass = 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-200'
                        textClass = 'text-red-900 font-bold'
                    }
                } else if (isSelected) {
                    buttonClass = 'ring-4 ring-black/5 shadow-md'
                    labelClass = 'text-white shadow-lg border-transparent'
                    textClass = 'font-bold'

                    inlineButtonStyle.backgroundColor = 'var(--qf-primary-light)'
                    inlineButtonStyle.borderColor = 'var(--qf-primary)'
                    inlineLabelStyle.backgroundColor = 'var(--qf-primary)'
                    inlineTextStyle.color = 'var(--qf-primary)'
                } else if (feedbackVisible) {
                    // Dim unselected options
                    buttonClass = 'border-white bg-slate-50/50 opacity-50 cursor-not-allowed'
                    labelClass = 'bg-slate-100 border-slate-200 text-slate-300'
                    textClass = 'text-slate-400 font-medium'
                } else {
                    // Default interactive state
                    buttonClass = 'border-white bg-white hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                    labelClass = 'bg-slate-50 border-slate-100 text-slate-400'
                    textClass = 'text-slate-600 font-semibold'
                }

                return (
                    <button
                        key={option.id}
                        disabled={feedbackVisible}
                        onClick={() => setAnswer(question.id, option.id)}
                        className={`w-full p-5 border-2 text-left transition-all group relative overflow-hidden ${buttonClass}`}
                        style={inlineButtonStyle}
                    >
                        <div className="flex items-center gap-6 relative z-10">
                            <div
                                className={`w-12 h-12 flex items-center justify-center text-sm font-black border-2 transition-all ${labelClass}`}
                                style={inlineLabelStyle}
                            >
                                {label}
                            </div>
                            <span className={`text-lg ${textClass}`} style={inlineTextStyle}>
                                {option.text}
                            </span>
                        </div>

                        {isSelected && !feedbackVisible && (
                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none" style={{ backgroundColor: 'var(--qf-primary)' }} />
                        )}
                        {isSelected && feedbackVisible && lastValidationResult?.is_correct && (
                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
                        )}
                        {isSelected && feedbackVisible && !lastValidationResult?.is_correct && (
                            <div className="absolute top-1/2 -translate-y-1/2 -right-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                        )}
                    </button>
                )
            })}
        </div>
    )
}
