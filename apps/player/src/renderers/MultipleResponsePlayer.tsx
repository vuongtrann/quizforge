import { usePlayerStore } from '../store/playerStore'
import { Check } from 'lucide-react'

export function MultipleResponsePlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer } = usePlayerStore()
    const question = quiz?.questions?.[currentQuestionIndex]

    if (!question) return null

    const currentSelection = (answers[question.id] as string[]) || []

    const toggleOption = (optionId: string) => {
        const newSelection = currentSelection.includes(optionId)
            ? currentSelection.filter(id => id !== optionId)
            : [...currentSelection, optionId]
        setAnswer(question.id, newSelection)
    }

    return (
        <div className="space-y-4">
            {question.options?.map((option) => {
                const isSelected = currentSelection.includes(option.id)
                return (
                    <button
                        key={option.id}
                        onClick={() => toggleOption(option.id)}
                        className={`w-full p-5 border-2 text-left transition-all group relative overflow-hidden ${isSelected
                            ? 'ring-4 ring-black/5 shadow-md'
                            : 'border-white bg-white hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                            }`}
                        style={{
                            borderRadius: 'var(--qf-radius)',
                            ...(isSelected ? {
                                backgroundColor: 'var(--qf-primary-light)',
                                borderColor: 'var(--qf-primary)'
                            } : {})
                        }}
                    >
                        <div className="flex items-center gap-6 relative z-10">
                            <div className={`w-8 h-8 flex items-center justify-center border-2 transition-all ${isSelected
                                ? 'text-white shadow-lg border-transparent'
                                : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 group-hover:border-slate-300'
                                }`}
                                style={{
                                    borderRadius: 'calc(var(--qf-radius) - 4px)',
                                    ...(isSelected ? { backgroundColor: 'var(--qf-primary)' } : {})
                                }}
                            >
                                {isSelected && <Check className="w-5 h-5 stroke-[4]" />}
                            </div>
                            <span className={`text-lg font-semibold ${isSelected ? '' : 'text-slate-600'
                                }`}
                                style={isSelected ? { color: 'var(--qf-primary)' } : {}}
                            >
                                {option.text}
                            </span>
                        </div>
                    </button>
                )
            })}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mt-6">
                Bạn có thể chọn nhiều đáp án
            </p>
        </div>
    )
}
