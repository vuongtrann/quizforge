import { Question } from "@quizforge/types"
import { cn } from "../../lib/utils"
import { TextCursorInput } from "lucide-react"

interface RendererProps {
    question: Question
    value: string | null
    onChange: (value: string) => void
    disabled?: boolean
}

export function FillInBlankRenderer({ value, onChange, disabled }: RendererProps) {
    return (
        <div className="flex flex-col items-center gap-8 py-10 w-full max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600 border-4 border-white shadow-xl">
                <TextCursorInput className="w-10 h-10" />
            </div>
            <div className="w-full relative group">
                <input
                    type="text"
                    disabled={disabled}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className={cn(
                        "w-full h-16 px-8 text-xl font-bold text-center bg-white border-2 border-slate-100 rounded-[1.5rem] shadow-sm transition-all outline-none",
                        value ? "border-brand-500 ring-4 ring-brand-50" : "focus:border-brand-300 focus:bg-slate-50 focus:ring-4 focus:ring-slate-50"
                    )}
                />

                <div className="flex justify-center gap-4 mt-8">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Nhấn Enter để xác nhận</p>
                </div>
            </div>
        </div>
    )
}
