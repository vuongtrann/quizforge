import { useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import type { QuizQuestion } from '../store/playerStore'

export function WordBankPlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer } = usePlayerStore()
    const question: QuizQuestion | undefined = quiz?.questions?.[currentQuestionIndex]
    const [selectedWordId, setSelectedWordId] = useState<string | null>(null)

    if (!question || question.type !== 'word_bank') return null

    const currentAnswers = (answers[question.id] as Record<string, string>) || {}
    const words = question.words ?? []

    // Words available in the bank (not currently in a slot)
    const usedWordIds = Object.values(currentAnswers)
    const availableWords = words.filter((w) => !usedWordIds.includes(w.id))

    const handleWordClick = (wordId: string) => {
        // If they click an available word, we highlight it
        setSelectedWordId(wordId === selectedWordId ? null : wordId)
    }

    const handleSlotClick = (slotId: string) => {
        const newAnswers = { ...currentAnswers }

        if (currentAnswers[slotId]) {
            // Already filled, clear it
            delete newAnswers[slotId]
            setAnswer(question.id, newAnswers)
        } else if (selectedWordId) {
            // Fill with selected word
            newAnswers[slotId] = selectedWordId
            setAnswer(question.id, newAnswers)
            setSelectedWordId(null)
        }
    }

    const parts = (question.templateText ?? '').split(/(\{\{[^}]+\}\})/)

    return (
        <div className="space-y-12">
            {/* Template Card */}
            <div className="bg-white p-12 border-2 border-slate-100 shadow-sm leading-[3] text-xl text-slate-700" style={{ borderRadius: 'calc(var(--qf-radius) + 0.5rem)' }}>
                {parts.map((part: string, index: number) => {
                    const match = part.match(/\{\{([^}]+)\}\}/)
                    if (match) {
                        const slotId = match[1]
                        const filledWordId = currentAnswers[slotId]
                        const filledWord = words.find((w) => w.id === filledWordId)

                        return (
                            <button
                                key={index}
                                onClick={() => handleSlotClick(slotId)}
                                className={`inline-flex items-center justify-center mx-2 h-10 min-w-[120px] border-2 transition-all px-4 font-bold ${filledWord
                                    ? 'shadow-lg shadow-black/5 text-white'
                                    : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                                    }`}
                                style={{
                                    borderRadius: 'var(--qf-radius)',
                                    ...(filledWord ? { backgroundColor: 'var(--qf-primary)', borderColor: 'var(--qf-primary)' } : {})
                                }}
                            >
                                {filledWord ? filledWord.text : '?'}
                            </button>
                        )
                    }
                    return <span key={index}>{part}</span>
                })}
            </div>

            {/* Word Bank */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">DANH SÁCH TỪ VỰNG</h4>
                <div className="flex flex-wrap gap-3 justify-center">
                    {availableWords.map((word) => (
                        <button
                            key={word.id}
                            onClick={() => handleWordClick(word.id)}
                            className={`px-6 py-3 border-2 font-bold transition-all active:scale-95 ${selectedWordId === word.id
                                ? 'text-white shadow-xl shadow-black/5 -translate-y-1'
                                : 'bg-white border-slate-100 text-slate-600 shadow-sm'
                                }`}
                            style={{
                                borderRadius: 'var(--qf-radius)',
                                ...(selectedWordId === word.id ? { backgroundColor: 'var(--qf-primary)', borderColor: 'var(--qf-primary)' } : {})
                            }}
                        >
                            {word.text}
                        </button>
                    ))}
                    {availableWords.length === 0 && (
                        <p className="text-xs italic text-slate-300">Tất cả các từ đã được sử dụng.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
