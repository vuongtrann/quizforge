import { MultipleResponseQuestion, MultipleChoiceOption } from "@quizforge/types"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "../../lib/utils"

interface MultipleResponseEditorProps {
    question: MultipleResponseQuestion
    onChange: (question: MultipleResponseQuestion) => void
}

export function MultipleResponseEditor({ question, onChange }: MultipleResponseEditorProps) {
    const options = question.options || []

    const handleAddOption = () => {
        if (options.length >= 10) return
        const newOption: MultipleChoiceOption = {
            id: crypto.randomUUID(),
            text: '',
            isCorrect: false,
        }
        onChange({ ...question, options: [...options, newOption] })
    }

    const handleRemoveOption = (id: string) => {
        if (options.length <= 2) return
        onChange({ ...question, options: options.filter(o => o.id !== id) })
    }

    const handleOptionChange = (id: string, text: string) => {
        onChange({ ...question, options: options.map(o => o.id === id ? { ...o, text } : o) })
    }

    const handleToggleCorrect = (id: string) => {
        onChange({ ...question, options: options.map(o => o.id === id ? { ...o, isCorrect: !o.isCorrect } : o) })
    }

    return (
        <div>
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="w-10 py-1.5 text-center text-[11px] font-semibold text-slate-600 border-r border-slate-200">No.</th>
                        <th className="w-16 py-1.5 text-center text-[11px] font-semibold text-slate-600 border-r border-slate-200">Đúng</th>
                        <th className="py-1.5 px-3 text-left text-[11px] font-semibold text-slate-600">Lựa chọn</th>
                        <th className="w-8" />
                    </tr>
                </thead>
                <tbody>
                    {options.map((opt, idx) => (
                        <tr
                            key={opt.id}
                            className={cn(
                                "border-b border-slate-100 group hover:bg-blue-50/20",
                                opt.isCorrect && "bg-emerald-50/40"
                            )}
                        >
                            <td className="py-1.5 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200">
                                {String.fromCharCode(65 + idx)}
                            </td>
                            <td className="py-1.5 text-center border-r border-slate-200">
                                <input
                                    type="checkbox"
                                    checked={opt.isCorrect}
                                    onChange={() => handleToggleCorrect(opt.id)}
                                    className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer rounded-sm"
                                />
                            </td>
                            <td className="py-1 px-3">
                                <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                                    placeholder={`Nhập lựa chọn ${String.fromCharCode(65 + idx)}...`}
                                    className={cn(
                                        "w-full text-[12px] border-none outline-none bg-transparent py-0.5",
                                        opt.isCorrect ? "font-medium text-emerald-800" : "text-slate-700"
                                    )}
                                />
                            </td>
                            <td className="py-1 pr-1 text-center">
                                <button
                                    onClick={() => handleRemoveOption(opt.id)}
                                    disabled={options.length <= 2}
                                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:hidden transition-opacity"
                                    title="Xóa lựa chọn"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <button
                    onClick={handleAddOption}
                    disabled={options.length >= 10}
                    className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
                </button>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={question.shuffleOptions}
                            onChange={(e) => onChange({ ...question, shuffleOptions: e.target.checked })}
                            className="w-3.5 h-3.5 rounded accent-blue-600"
                        />
                        Trộn đáp án
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={question.partialScoring}
                            onChange={(e) => onChange({ ...question, partialScoring: e.target.checked })}
                            className="w-3.5 h-3.5 rounded accent-blue-600"
                        />
                        Điểm một phần
                    </label>
                </div>
            </div>
        </div>
    )
}
