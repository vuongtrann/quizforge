import { usePlayerStore } from '../store/playerStore'

export function FillInBlankPlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer } = usePlayerStore()
    const question = quiz?.questions?.[currentQuestionIndex]

    if (!question || question.type !== 'fill_in_blank') return null

    const currentAnswers = (answers[question.id] as Record<string, string>) || {}

    const handleInputChange = (blankId: string, value: string) => {
        setAnswer(question.id, {
            ...currentAnswers,
            [blankId]: value
        })
    }

    // Split templateText by {{uuid}} patterns
    const parts = (question.templateText ?? '').split(/(\{\{[^}]+\}\})/)

    return (
        <div className="bg-white p-10 border-2 border-slate-100 shadow-sm leading-relaxed text-lg text-slate-700" style={{ borderRadius: 'var(--qf-radius)' }}>
            {parts.map((part: string, index: number) => {
                const match = part.match(/\{\{([^}]+)\}\}/)
                if (match) {
                    const blankId = match[1]
                    return (
                        <input
                            key={index}
                            type="text"
                            value={currentAnswers[blankId] || ''}
                            onChange={(e) => handleInputChange(blankId, e.target.value)}
                            className="qf-input inline-block mx-2 h-9 px-3 min-w-[120px] bg-slate-50 border-b-2 border-slate-200 outline-none transition-all font-bold rounded-t-lg"
                            style={{
                                color: 'var(--qf-primary)',
                                // The focus state will need to be handled via CSS or focus-within, but for inline styles we can use a class and defined it in index.css
                            }}
                            placeholder="..."
                        />
                    )
                }
                return <span key={index}>{part}</span>
            })}
        </div>
    )
}
