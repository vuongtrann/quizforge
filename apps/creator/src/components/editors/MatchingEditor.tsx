import { MatchingQuestion, MatchingPair } from "@quizforge/types"
import { Button } from "../ui/button"
import { Plus, Trash2, Link as LinkIcon } from "lucide-react"

interface MatchingEditorProps {
    question: MatchingQuestion
    onChange: (question: MatchingQuestion) => void
}

export function MatchingEditor({ question, onChange }: MatchingEditorProps) {
    const pairs = question.pairs || []

    const handleAddPair = () => {
        if (pairs.length >= 10) return
        const newPair: MatchingPair = {
            id: crypto.randomUUID(),
            choice: '',
            match: ''
        }
        onChange({ ...question, pairs: [...pairs, newPair] })
    }

    const handleRemovePair = (id: string) => {
        if (pairs.length <= 2) return
        const newPairs = pairs.filter(p => p.id !== id)
        onChange({ ...question, pairs: newPairs })
    }

    const handlePairChange = (id: string, field: 'choice' | 'match', value: string) => {
        const newPairs = pairs.map(p => p.id === id ? { ...p, [field]: value } : p)
        onChange({ ...question, pairs: newPairs })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b pb-2">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    Nội dung ghép đôi (Matching)
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight cursor-pointer">
                        <input
                            type="checkbox"
                            checked={question.shuffleChoices}
                            onChange={(e) => onChange({ ...question, shuffleChoices: e.target.checked })}
                            className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        Trộn cột A
                    </label>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight cursor-pointer">
                        <input
                            type="checkbox"
                            checked={question.shuffleMatches}
                            onChange={(e) => onChange({ ...question, shuffleMatches: e.target.checked })}
                            className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        Trộn cột B
                    </label>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {pairs.map((pair, idx) => (
                    <div key={pair.id} className="flex items-center gap-4 group bg-slate-50 border border-slate-200 p-3 rounded-xl transition-all shadow-sm shadow-black/[0.02] hover:border-brand-200">
                        <div className="flex flex-col items-center justify-center w-8 text-[11px] font-bold text-slate-400 font-mono tracking-tighter opacity-70">
                            {idx + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-[1fr,40px,1fr] items-center gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Vế A</span>
                                <textarea
                                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none resize-none transition-all shadow-inner-sm"
                                    placeholder="Nhập vế trái..."
                                    rows={2}
                                    value={pair.choice}
                                    onChange={(e) => handlePairChange(pair.id, 'choice', e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-center pt-5">
                                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 shadow-inner">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Vế B</span>
                                <textarea
                                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-brand-500 outline-none resize-none transition-all shadow-inner-sm"
                                    placeholder="Nhập vế phải..."
                                    rows={2}
                                    value={pair.match}
                                    onChange={(e) => handlePairChange(pair.id, 'match', e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleRemovePair(pair.id)}
                            disabled={pairs.length <= 2}
                            className="p-1 px-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:hidden transition-all pt-5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleAddPair}
                disabled={pairs.length >= 10}
                className="w-fit gap-2 border-dashed border-slate-300 text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all mt-2 h-9 px-4"
            >
                <Plus className="w-3.5 h-3.5" /> THÊM CẶP GHÉP
            </Button>
        </div>
    )
}
