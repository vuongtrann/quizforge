import { BlankPage } from "@quizforge/types"
import { Info } from "lucide-react"

interface BlankPageEditorProps {
    question: BlankPage
    onChange: (question: BlankPage) => void
}

export function BlankPageEditor({ question, onChange }: BlankPageEditorProps) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 shadow-sm">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs text-left">
                    <p className="font-bold uppercase tracking-tight mb-1">Trang thông tin (Blank Page)</p>
                    <p className="opacity-80">Trang này không có câu hỏi hay tính điểm. Nó dùng để cung cấp thông tin, hướng dẫn hoặc tài liệu tham khảo cho người học giữa các câu hỏi.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tiêu đề trang</span>
                    <input
                        type="text"
                        className="w-full h-10 px-4 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                        placeholder="Nhập tiêu đề trang..."
                        value={question.title || ''}
                        onChange={(e) => onChange({ ...question, title: e.target.value })}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nội dung hiển thị</span>
                    <textarea
                        className="w-full min-h-[150px] p-4 text-base text-slate-800 placeholder:text-slate-300 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 focus:bg-white transition-all outline-none leading-relaxed"
                        placeholder="Nhập nội dung thông tin hoặc hướng dẫn tại đây..."
                        value={question.content || ''}
                        onChange={(e) => onChange({ ...question, content: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={question.showTimer}
                            onChange={(e) => onChange({ ...question, showTimer: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-[11px] font-medium text-slate-500">Hiển thị đồng hồ đếm ngược (nếu có)</span>
                    </label>
                </div>
            </div>
        </div>
    )
}
