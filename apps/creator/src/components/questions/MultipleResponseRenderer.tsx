import { Question, MultipleResponseQuestion } from "@quizforge/types"
import { cn } from "../../lib/utils"
import { Check } from "lucide-react"

interface RendererProps {
    question: Question
    value: string[] | null // Array of IDs
    onChange: (value: string[]) => void
    disabled?: boolean
}

export function MultipleResponseRenderer({ question, value, onChange, disabled }: RendererProps) {
    const mrq = question as MultipleResponseQuestion
    const options = mrq.options
    const selectedIds = value || []

    const toggleId = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(v => v !== id))
        } else {
            onChange([...selectedIds, id])
        }
    }

    return (
        <div className="space-y-4 w-full flex flex-col items-center">
            <div className="grid grid-cols-1 gap-3 w-full">
                {options.map((option) => {
                    const isSelected = selectedIds.includes(option.id)

                    return (
                        <button
                            key={option.id}
                            disabled={disabled}
                            onClick={() => toggleId(option.id)}
                            className={cn(
                                "group relative flex items-center p-5 rounded-[1.5rem] border-2 text-left transition-all duration-300",
                                isSelected
                                    ? "bg-brand-50 border-brand-500 ring-4 ring-brand-50 scale-[1.02]"
                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all flex-shrink-0 mr-5 border-2",
                                isSelected ? "bg-brand-500 text-white shadow-lg border-brand-500" : "bg-white border-slate-100 text-transparent group-hover:border-brand-200"
                            )}>
                                {isSelected && <Check className="w-5 h-5 stroke-[4px]" />}
                            </div>

                            <div className="flex-1">
                                <span className={cn(
                                    "text-sm font-bold tracking-tight transition-all",
                                    isSelected ? "text-brand-900" : "text-slate-700"
                                )}>
                                    {option.text}
                                </span>
                            </div>

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
