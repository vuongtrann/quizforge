import { Question, MultipleChoiceQuestion } from "@quizforge/types"
import { cn } from "../../lib/utils"
import { CheckCircle2 } from "lucide-react"

interface RendererProps {
    question: Question
    value: string | null
    onChange: (value: string) => void
    disabled?: boolean
}

export function MultipleChoiceRenderer({ question, value, onChange, disabled }: RendererProps) {
    const mcq = question as MultipleChoiceQuestion
    const options = mcq.options

    return (
        <div className="space-y-4 w-full flex flex-col items-center">
            <div className="grid grid-cols-1 gap-3 w-full">
                {options.map((option, index) => {
                    const isSelected = value === option.id
                    const label = String.fromCharCode(65 + index) // A, B, C...

                    return (
                        <button
                            key={option.id}
                            disabled={disabled}
                            onClick={() => onChange(option.id)}
                            className={cn(
                                "group relative flex items-center p-5 rounded-[1.5rem] border-2 text-left transition-all duration-300",
                                isSelected
                                    ? "bg-brand-50 border-brand-500 ring-4 ring-brand-50 scale-[1.02]"
                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all flex-shrink-0 mr-5",
                                isSelected ? "bg-brand-500 text-white shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600"
                            )}>
                                {label}
                            </div>

                            <div className="flex-1">
                                <span className={cn(
                                    "text-sm font-bold tracking-tight transition-all",
                                    isSelected ? "text-brand-900" : "text-slate-700"
                                )}>
                                    {option.text}
                                </span>
                            </div>

                            {isSelected && (
                                <div className="ml-4 text-brand-500">
                                    <CheckCircle2 className="w-5 h-5 fill-current bg-white rounded-full shadow-sm" />
                                </div>
                            )}

                            {/* Ripple-like glow Background */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-1000",
                                isSelected ? "opacity-100 animate-pulse" : "opacity-0"
                            )} />
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
