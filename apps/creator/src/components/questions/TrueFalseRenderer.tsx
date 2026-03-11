import { Question } from "@quizforge/types"
import { cn } from "../../lib/utils"
import { Check, X } from "lucide-react"

interface RendererProps {
    question: Question
    value: string | null // 'true' or 'false'
    onChange: (value: string) => void
    disabled?: boolean
}

export function TrueFalseRenderer({ value, onChange, disabled }: RendererProps) {
    const isTrue = value === 'true'
    const isFalse = value === 'false'

    return (
        <div className="flex gap-10 w-full max-w-lg mx-auto py-10">
            <button
                disabled={disabled}
                onClick={() => onChange('true')}
                className={cn(
                    "flex-1 group relative flex flex-col items-center gap-6 p-8 rounded-[2.5rem] border-2 transition-all duration-500",
                    isTrue
                        ? "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-50 scale-105"
                        : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 shadow-sm"
                )}
            >
                <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl border-4",
                    isTrue ? "bg-emerald-500 text-white border-emerald-400 rotate-12 scale-110" : "bg-slate-50 text-slate-200 border-white group-hover:rotate-6 group-hover:bg-white group-hover:text-emerald-300"
                )}>
                    <Check className="w-10 h-10 stroke-[4px]" />
                </div>
                <h4 className={cn("text-lg font-black uppercase tracking-tighter", isTrue ? "text-emerald-800" : "text-slate-400 group-hover:text-emerald-400")}>Đúng</h4>
            </button>

            <button
                disabled={disabled}
                onClick={() => onChange('false')}
                className={cn(
                    "flex-1 group relative flex flex-col items-center gap-6 p-8 rounded-[2.5rem] border-2 transition-all duration-500",
                    isFalse
                        ? "bg-red-50 border-red-500 ring-4 ring-red-50 scale-105"
                        : "bg-white border-slate-100 hover:border-red-200 hover:bg-red-50/20 shadow-sm"
                )}
            >
                <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl border-4",
                    isFalse ? "bg-red-500 text-white border-red-400 -rotate-12 scale-110" : "bg-slate-50 text-slate-200 border-white group-hover:-rotate-6 group-hover:bg-white group-hover:text-red-300"
                )}>
                    <X className="w-10 h-10 stroke-[4px]" />
                </div>
                <h4 className={cn("text-lg font-black uppercase tracking-tighter", isFalse ? "text-red-800" : "text-slate-400 group-hover:text-red-400")}>Sai</h4>
            </button>
        </div>
    )
}
