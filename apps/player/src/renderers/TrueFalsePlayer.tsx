import { usePlayerStore } from '../store/playerStore'
import { Check, X } from 'lucide-react'

export function TrueFalsePlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer, feedbackVisible, lastValidationResult } = usePlayerStore()
    const question = quiz?.questions?.[currentQuestionIndex]

    if (!question || question.type !== 'true_false') return null

    const options = [
        { id: 'true', label: '1', text: 'Đúng', icon: <Check className="w-8 h-8" /> },
        { id: 'false', label: '2', text: 'Sai', icon: <X className="w-8 h-8" /> }
    ]

    return (
        <div className="grid grid-cols-2 gap-6 mt-8">
            {options.map((option) => {
                const isSelected = answers[question.id] === option.id

                let inlineButtonStyle: React.CSSProperties = { borderRadius: 'calc(var(--qf-radius) + 1rem)' } // Extra round for TF buttons
                let inlineIconStyle: React.CSSProperties = { borderRadius: 'calc(var(--qf-radius) - 4px)' }
                let inlineTextStyle: React.CSSProperties = {}

                let buttonClass = ''
                let textClass = ''
                let iconClass = ''

                if (feedbackVisible && isSelected) {
                    if (lastValidationResult?.is_correct) {
                        buttonClass = 'border-green-500 bg-green-50 ring-4 ring-green-500/10'
                        textClass = 'text-green-900'
                        iconClass = 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-200'
                    } else {
                        buttonClass = 'border-red-500 bg-red-50 ring-4 ring-red-500/10'
                        textClass = 'text-red-900'
                        iconClass = 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-200'
                    }
                } else if (isSelected) {
                    buttonClass = 'shadow-xl shadow-black/5 ring-4 ring-black/5 -translate-y-2 scale-105 z-10'
                    textClass = 'font-bold'
                    iconClass = 'text-white shadow-lg border-transparent'

                    inlineButtonStyle.backgroundColor = 'var(--qf-primary-light)'
                    inlineButtonStyle.borderColor = 'var(--qf-primary)'
                    inlineTextStyle.color = 'var(--qf-primary)'
                    inlineIconStyle.backgroundColor = 'var(--qf-primary)'
                } else if (feedbackVisible) {
                    buttonClass = 'border-white bg-slate-50/50 opacity-50 cursor-not-allowed'
                    textClass = 'text-slate-400'
                    iconClass = 'bg-slate-100 border-slate-200 text-slate-300'
                } else if (answers[question.id]) {
                    // Dim unselected if something is selected but no feedback yet
                    buttonClass = 'border-slate-50 bg-slate-50 opacity-60 scale-95 hover:opacity-100 hover:scale-100'
                } else {
                    // Default state
                    buttonClass = 'border-white bg-white hover:border-slate-200 hover:bg-slate-50 hover:-translate-y-1 shadow-sm'
                }

                return (
                    <button
                        key={option.id}
                        disabled={feedbackVisible}
                        onClick={() => setAnswer(question.id, option.id)}
                        className={`p-10 border-2 flex flex-col items-center justify-center gap-6 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden group ${buttonClass}`}
                        style={inlineButtonStyle}
                    >
                        <div
                            className={`w-20 h-20 flex items-center justify-center border-2 transition-all duration-300 ${iconClass}`}
                            style={inlineIconStyle}
                        >
                            {option.icon}
                        </div>

                        <span className={`text-4xl font-black tracking-tight ${textClass}`} style={inlineTextStyle}>
                            {option.text}
                        </span>

                        {/* Keyboard shortcut hint */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phím</span>
                            <kbd className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-mono text-xs shadow-sm font-bold">
                                {option.label}
                            </kbd>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
