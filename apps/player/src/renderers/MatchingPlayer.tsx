import { useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { Link2 } from 'lucide-react'

export function MatchingPlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer } = usePlayerStore()
    const question = quiz?.questions?.[currentQuestionIndex]
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null)

    if (!question || question.type !== 'matching') return null

    // pairs: { id, choice, match }
    const pairs = question.pairs ?? []
    const leftItems = pairs.map((p) => ({ id: p.id, text: p.choice }))
    const rightItems = [...pairs].map((p) => ({ id: p.id, text: p.match }))
        .sort((a, b) => a.text.localeCompare(b.text)) // Shuffle or sort matches

    const currentMatches = (answers[question.id] as Record<string, string>) || {}

    const handleMatch = (rightId: string) => {
        if (!selectedLeft) return

        // Check if this rightId is already matched to something else
        const newMatches = { ...currentMatches }

        // Remove existing match for this rightId if any
        Object.keys(newMatches).forEach(k => {
            if (newMatches[k] === rightId) delete newMatches[k]
        })

        newMatches[selectedLeft] = rightId
        setAnswer(question.id, newMatches)
        setSelectedLeft(null)
    }

    const unmatch = (leftId: string) => {
        const newMatches = { ...currentMatches }
        delete newMatches[leftId]
        setAnswer(question.id, newMatches)
    }

    return (
        <div className="grid grid-cols-2 gap-20 relative">
            {/* Connection Lines (SVG) - Simplified for now */}

            <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-4">CỘT A</h4>
                {leftItems.map((item) => {
                    const isSelected = selectedLeft === item.id
                    const isMatched = !!currentMatches[item.id]

                    return (
                        <button
                            key={item.id}
                            onClick={() => isSelected ? setSelectedLeft(null) : setSelectedLeft(item.id)}
                            className={`w-full p-4 border-2 text-left transition-all flex items-center justify-between group ${isSelected
                                ? 'ring-4 ring-black/5'
                                : isMatched
                                    ? 'bg-white'
                                    : 'border-white bg-white hover:border-slate-100 shadow-sm'
                                }`}
                            style={{
                                borderRadius: 'var(--qf-radius)',
                                ...(isSelected ? { backgroundColor: 'var(--qf-primary-light)', borderColor: 'var(--qf-primary)' } : {}),
                                ...(!isSelected && isMatched ? { borderColor: 'var(--qf-primary-light)' } : {})
                            }}
                        >
                            <span className="font-bold text-slate-700">{item.text}</span>
                            {isMatched ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); unmatch(item.id); }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:brightness-110"
                                    style={{ backgroundColor: 'var(--qf-primary-light)', color: 'var(--qf-primary)' }}
                                >
                                    <Link2 className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-200 transition-colors" style={isSelected ? { backgroundColor: 'var(--qf-primary)' } : {}} />
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="space-y-3 pt-14">
                {rightItems.map((item, idx: number) => {
                    const matchedLeftId = Object.keys(currentMatches).find(k => currentMatches[k] === item.id)
                    const matchedLeftText = leftItems.find((l) => l.id === matchedLeftId)?.text

                    return (
                        <button
                            key={`${item.id}-${idx}`}
                            onClick={() => handleMatch(item.id)}
                            disabled={!selectedLeft && !matchedLeftId}
                            className={`w-full p-4 border-2 text-left transition-all relative ${matchedLeftId
                                ? 'text-white shadow-lg'
                                : selectedLeft
                                    ? 'border-slate-200 bg-white'
                                    : 'border-white bg-white opacity-50'
                                }`}
                            style={{
                                borderRadius: 'var(--qf-radius)',
                                ...(matchedLeftId ? { backgroundColor: 'var(--qf-primary)', borderColor: 'var(--qf-primary)' } : {}),
                                ...(!matchedLeftId && selectedLeft ? { /* fallback or outline, relying on hover in css */ } : {})
                            }}
                        >
                            <div className="flex flex-col">
                                {matchedLeftId && (
                                    <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80" style={{ color: 'var(--qf-primary-light)' }}>GHÉP VỚI: {matchedLeftText}</span>
                                )}
                                <span className="font-bold">{item.text}</span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
