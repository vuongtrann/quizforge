import { WordBankQuestion, WordBankWord, WordBankSlot } from "@quizforge/types"
import { Button } from "../ui/button"
import { Plus, Trash2, HelpCircle } from "lucide-react"
import { cn } from "../../lib/utils"

interface WordBankEditorProps {
    question: WordBankQuestion
    onChange: (question: WordBankQuestion) => void
}

export function WordBankEditor({ question, onChange }: WordBankEditorProps) {
    const words = question.words || []
    const slots = question.slots || []

    const handleAddWord = () => {
        const newWord: WordBankWord = {
            id: crypto.randomUUID(),
            text: '',
            isDistractor: true
        }
        onChange({ ...question, words: [...words, newWord] })
    }

    const handleRemoveWord = (id: string) => {
        const newWords = words.filter(w => w.id !== id)
        // Also remove slot if this word was correct
        const newSlots = slots.filter(s => s.correctWordId !== id)
        onChange({ ...question, words: newWords, slots: newSlots })
    }

    const handleWordChange = (id: string, text: string) => {
        const newWords = words.map(w => w.id === id ? { ...w, text } : w)
        onChange({ ...question, words: newWords })
    }

    const handleToggleSlot = (id: string) => {
        const word = words.find(w => w.id === id)
        if (!word) return

        if (!word.isDistractor) {
            // Convert to distractor: remove slot and its {{slotId}} placeholder from template
            const slot = slots.find(s => s.correctWordId === id)
            const newSlots = slots.filter(s => s.correctWordId !== id)
            const newWords = words.map(w => w.id === id ? { ...w, isDistractor: true } : w)
            const newTemplate = slot
                ? question.templateText.replace(new RegExp(`\\{\\{${slot.id}\\}\\}`, 'g'), '')
                : question.templateText
            onChange({ ...question, words: newWords, slots: newSlots, templateText: newTemplate.trim() })
        } else {
            // Convert to slot: create slot UUID, append {{slotId}} to template
            const slotId = crypto.randomUUID()
            const newSlot: WordBankSlot = {
                id: slotId,
                position: slots.length,
                correctWordId: id,
            }
            const newWords = words.map(w => w.id === id ? { ...w, isDistractor: false } : w)
            onChange({
                ...question,
                words: newWords,
                slots: [...slots, newSlot],
                templateText: question.templateText + ` {{${slotId}}}`,
            })
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        Nội dung văn bản (có Ô chữ)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                </div>
                <textarea
                    className="w-full min-h-[100px] p-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all outline-none leading-relaxed font-mono"
                    placeholder="Dựng văn bản tại đây..."
                    value={question.templateText}
                    onChange={(e) => onChange({ ...question, templateText: e.target.value })}
                />
            </div>

            <div className="flex flex-col gap-4">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-2 flex items-center justify-between">
                    Ngân hàng từ ngữ (Word Bank)
                    <Button variant="ghost" size="sm" onClick={handleAddWord} className="h-7 px-3 text-brand-600 hover:bg-brand-50 text-[10px] uppercase font-bold tracking-tight border border-brand-100 rounded-full shadow-sm bg-white">
                        <Plus className="w-3.5 h-3.5 mr-1" /> THÊM TỪ MỚI
                    </Button>
                </div>

                {words.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                        Hãy bắt đầu thêm từ vào ngân hàng.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {words.map((word) => (
                            <div key={word.id} className={cn(
                                "flex items-center gap-2 group border p-1 rounded-full pl-3 pr-1 transition-all shadow-sm",
                                !word.isDistractor ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
                            )}>
                                <input
                                    type="text"
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 h-4 min-w-[80px]"
                                    placeholder="Từ mới..."
                                    value={word.text}
                                    onChange={(e) => handleWordChange(word.id, e.target.value)}
                                />
                                <div className="h-4 w-px bg-slate-100 mx-1" />
                                <button
                                    onClick={() => handleToggleSlot(word.id)}
                                    title={!word.isDistractor ? "Đã gán vào văn bản" : "Chưa gán vào văn bản (Distractor)"}
                                    className={cn(
                                        "text-[8px] font-bold px-1 py-0.5 rounded-full uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity",
                                        !word.isDistractor ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white"
                                    )}
                                >
                                    {!word.isDistractor ? '✓ ĐÃ GÁN' : 'GÁN VÀO VĂN BẢN'}
                                </button>
                                <button
                                    onClick={() => handleRemoveWord(word.id)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors ml-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={question.shuffleWords}
                            onChange={(e) => onChange({ ...question, shuffleWords: e.target.checked })}
                            className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-[11px] font-medium text-slate-500">Trộn các từ trong ngân hàng</span>
                    </label>
                </div>
            </div>
        </div>
    )
}
