import { SequenceQuestion, SequenceItem } from "@quizforge/types"
import { Button } from "../ui/button"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"

interface SequenceEditorProps {
    question: SequenceQuestion
    onChange: (question: SequenceQuestion) => void
}

export function SequenceEditor({ question, onChange }: SequenceEditorProps) {
    const items = question.items || []

    const handleAddItem = () => {
        if (items.length >= 10) return
        const newItem: SequenceItem = {
            id: crypto.randomUUID(),
            text: '',
            correctOrder: items.length
        }
        onChange({ ...question, items: [...items, newItem] })
    }

    const handleRemoveItem = (id: string) => {
        if (items.length <= 2) return
        const newItems = items.filter(i => i.id !== id).map((item, idx) => ({ ...item, correctOrder: idx }))
        onChange({ ...question, items: newItems })
    }

    const handleItemChange = (id: string, text: string) => {
        const newItems = items.map(i => i.id === id ? { ...i, text } : i)
        onChange({ ...question, items: newItems })
    }

    const moveItem = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= items.length) return
        const newItems = [...items]
        const [movedItem] = newItems.splice(fromIdx, 1)
        newItems.splice(toIdx, 0, movedItem)
        onChange({ ...question, items: newItems.map((item, idx) => ({ ...item, correctOrder: idx })) })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b pb-2">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    Sắp xếp thứ tự (Sequence)
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={question.partialScoring}
                            onChange={(e) => onChange({ ...question, partialScoring: e.target.checked })}
                            className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        Đạt điểm một phần
                    </label>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Thứ tự đúng</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 group bg-white border border-slate-200 p-2 pl-1 rounded-xl shadow-sm hover:border-brand-300 transition-all hover:shadow-md hover:shadow-black/[0.05]">
                        <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing px-1 pt-1">
                            <button onClick={() => moveItem(idx, idx - 1)} disabled={idx === 0} className="hover:text-brand-600 disabled:opacity-0 active:scale-95 transition-all">
                                <div className="w-4 h-4 rounded hover:bg-slate-100 flex items-center justify-center">▲</div>
                            </button>
                            <button onClick={() => moveItem(idx, idx + 1)} disabled={idx === items.length - 1} className="hover:text-brand-600 disabled:opacity-0 active:scale-95 transition-all">
                                <div className="w-4 h-4 rounded hover:bg-slate-100 flex items-center justify-center">▼</div>
                            </button>
                        </div>

                        <div className="flex-1 flex items-center gap-4 py-1.5 px-1 font-left text-left">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold font-mono text-slate-400 shadow-inner">
                                {idx + 1}
                            </div>
                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 placeholder:text-slate-300 text-slate-700 transition-colors py-1 outline-none"
                                placeholder={`Nhập phần tử thứ ${idx + 1}...`}
                                value={item.text}
                                onChange={(e) => handleItemChange(item.id, e.target.value)}
                            />
                        </div>

                        <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length <= 2}
                            className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:hidden transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={items.length >= 10}
                className="w-fit gap-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-brand-600 hover:border-brand-200 transition-all mt-2 h-9 px-4 uppercase tracking-tighter font-bold text-[11px]"
            >
                <Plus className="w-3.5 h-3.5" /> Thêm phần tử
            </Button>
        </div>
    )
}
