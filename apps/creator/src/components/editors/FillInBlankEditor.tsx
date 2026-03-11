import { FillInBlankQuestion, Blank } from "@quizforge/types"
import { Button } from "../ui/button"
import { Plus, Trash2, HelpCircle } from "lucide-react"

interface FillInBlankEditorProps {
    question: FillInBlankQuestion
    onChange: (question: FillInBlankQuestion) => void
}

export function FillInBlankEditor({ question, onChange }: FillInBlankEditorProps) {
    const blanks = question.blanks || []

    const handleAddBlank = () => {
        const newBlank: Blank = {
            id: crypto.randomUUID(),
            position: blanks.length,
            acceptableAnswers: [''],
            caseSensitive: false,
            trimWhitespace: true
        }

        // Insert placeholder into text if possible, or just add to list
        const placeholder = `{{blank_${newBlank.id.slice(0, 4)}}}`
        onChange({
            ...question,
            templateText: question.templateText + placeholder,
            blanks: [...blanks, newBlank]
        })
    }

    const handleRemoveBlank = (id: string) => {
        const newBlanks = blanks.filter(b => b.id !== id)
        // Remove placeholder from text
        const placeholderRegex = new RegExp(`{{blank_${id.slice(0, 4)}}}`, 'g')
        onChange({
            ...question,
            templateText: question.templateText.replace(placeholderRegex, ''),
            blanks: newBlanks
        })
    }

    const handleAnswerChange = (blankId: string, idx: number, value: string) => {
        const newBlanks = blanks.map(b => {
            if (b.id === blankId) {
                const newAnswers = [...b.acceptableAnswers]
                newAnswers[idx] = value
                return { ...b, acceptableAnswers: newAnswers }
            }
            return b
        })
        onChange({ ...question, blanks: newBlanks })
    }

    const handleAddAnswer = (blankId: string) => {
        const newBlanks = blanks.map(b => {
            if (b.id === blankId) {
                return { ...b, acceptableAnswers: [...b.acceptableAnswers, ''] }
            }
            return b
        })
        onChange({ ...question, blanks: newBlanks })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        Nội dung văn bản (có ô trống)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    </div>
                </div>
                <textarea
                    className="w-full min-h-[120px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all outline-none leading-relaxed font-mono"
                    placeholder="Ví dụ: Thủ đô của Việt Nam là {{blank_1}}."
                    value={question.templateText}
                    onChange={(e) => onChange({ ...question, templateText: e.target.value })}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddBlank}
                    className="w-fit h-8 px-3 text-[11px] font-bold gap-1.5 border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                    <Plus className="w-3.5 h-3.5" /> CHÈN Ô TRỐNG
                </Button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-2">
                    Thiết lập đáp án cho các ô trống
                </div>

                {blanks.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                        Chưa có ô trống nào được tạo.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {blanks.map((blank, bIdx) => (
                            <div key={blank.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm group hover:border-brand-300 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-brand-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {bIdx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-slate-600 uppercase">Ô trống ID: {blank.id.slice(0, 4)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveBlank(blank.id)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Các đáp án chấp nhận:</div>
                                    {blank.acceptableAnswers.map((ans, aIdx) => (
                                        <div key={aIdx} className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 h-8 text-sm px-3 rounded-md border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none"
                                                value={ans}
                                                placeholder="Nhập đáp án..."
                                                onChange={(e) => handleAnswerChange(blank.id, aIdx, e.target.value)}
                                            />
                                            {blank.acceptableAnswers.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        const newBlanks = blanks.map(b => b.id === blank.id ? { ...b, acceptableAnswers: b.acceptableAnswers.filter((_, i) => i !== aIdx) } : b)
                                                        onChange({ ...question, blanks: newBlanks })
                                                    }}
                                                    className="p-1 px-2 text-slate-300 hover:text-slate-500"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleAddAnswer(blank.id)}
                                        className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1 mt-1 pl-1"
                                    >
                                        <Plus className="w-3 h-3" /> Thêm đáp án thay thế
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
                                    <label className="flex items-center gap-2 cursor-pointer group/label">
                                        <input
                                            type="checkbox"
                                            checked={blank.caseSensitive}
                                            onChange={(e) => {
                                                const newBlanks = blanks.map(b => b.id === blank.id ? { ...b, caseSensitive: e.target.checked } : b)
                                                onChange({ ...question, blanks: newBlanks })
                                            }}
                                            className="rounded text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-[11px] font-medium text-slate-500 group-hover/label:text-slate-700">Phân biệt hoa/thường</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group/label">
                                        <input
                                            type="checkbox"
                                            checked={blank.trimWhitespace}
                                            onChange={(e) => {
                                                const newBlanks = blanks.map(b => b.id === blank.id ? { ...b, trimWhitespace: e.target.checked } : b)
                                                onChange({ ...question, blanks: newBlanks })
                                            }}
                                            className="rounded text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-[11px] font-medium text-slate-500 group-hover/label:text-slate-700">Loại bỏ khoảng trắng</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
