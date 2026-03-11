import { ShortEssayQuestion } from "@quizforge/types"
import { Button } from "../ui/button"
import { Plus, Trash2, Info } from "lucide-react"

interface ShortEssayEditorProps {
    question: ShortEssayQuestion
    onChange: (question: ShortEssayQuestion) => void
}

export function ShortEssayEditor({ question, onChange }: ShortEssayEditorProps) {
    const keywords = question.keywordMatching || []

    const handleAddKeyword = () => {
        onChange({ ...question, keywordMatching: [...keywords, ''] })
    }

    const handleRemoveKeyword = (idx: number) => {
        onChange({ ...question, keywordMatching: keywords.filter((_, i) => i !== idx) })
    }

    const handleKeywordChange = (idx: number, value: string) => {
        const newKeywords = [...keywords]
        newKeywords[idx] = value
        onChange({ ...question, keywordMatching: newKeywords })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        Câu trả lời mẫu gợi ý (Tùy chọn)
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                </div>
                <textarea
                    className="w-full min-h-[100px] p-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all outline-none leading-relaxed"
                    placeholder="Nhập câu trả lời mẫu cho AI tham khảo..."
                    value={question.referenceAnswer || ''}
                    onChange={(e) => onChange({ ...question, referenceAnswer: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1.5 flex items-center justify-between">
                        Từ khóa bắt buộc
                        <Button variant="ghost" size="sm" onClick={handleAddKeyword} className="h-6 px-2 text-brand-600 hover:bg-brand-50 text-[10px] uppercase font-bold tracking-tight">
                            <Plus className="w-3 h-3 mr-1" /> Thêm từ khóa
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {keywords.map((kw, idx) => (
                            <div key={idx} className="flex items-center gap-1 group bg-white border border-slate-200 rounded-full px-3 py-1 hover:border-brand-500 transition-all shadow-sm">
                                <input
                                    type="text"
                                    className="bg-transparent border-none text-xs font-medium focus:ring-0 p-0 h-4 min-w-[60px]"
                                    placeholder="Từ khóa..."
                                    value={kw}
                                    onChange={(e) => handleKeywordChange(idx, e.target.value)}
                                />
                                <button
                                    onClick={() => handleRemoveKeyword(idx)}
                                    className="text-slate-300 hover:text-red-500 group-hover:opacity-100 opacity-30 transition-all ml-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {keywords.length === 0 && (
                            <span className="text-xs text-slate-400 italic py-2">Chưa thêm từ khóa nào.</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1.5 flex items-center justify-between">
                        Giới hạn từ ngữ (Tùy chọn)
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600">Số lượng từ tối đa:</span>
                        <input
                            type="number"
                            className="w-20 h-8 text-sm px-3 border border-slate-200 rounded-md focus:ring-1 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-all font-mono font-bold text-center"
                            value={question.maxWords || 0}
                            onChange={(e) => onChange({ ...question, maxWords: parseInt(e.target.value) || 0 })}
                            placeholder="0 (không giới hạn)"
                        />
                        <span className="text-[10px] text-slate-400 italic">0 = Không giới hạn</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
