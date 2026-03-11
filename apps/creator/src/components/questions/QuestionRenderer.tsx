import { Question } from "@quizforge/types"
import { MultipleChoiceRenderer } from "./MultipleChoiceRenderer"
import { TrueFalseRenderer } from "./TrueFalseRenderer"
import { MultipleResponseRenderer } from "./MultipleResponseRenderer"
import { FillInBlankRenderer } from "./FillInBlankRenderer"

interface QuestionRendererProps {
    question: Question
    value: any
    onChange: (value: any) => void
    disabled?: boolean
}

export function QuestionRenderer({ question, value, onChange, disabled }: QuestionRendererProps) {
    switch (question.type) {
        case 'multiple_choice':
            return <MultipleChoiceRenderer question={question} value={value} onChange={onChange} disabled={disabled} />
        case 'true_false':
            return <TrueFalseRenderer question={question} value={value} onChange={onChange} disabled={disabled} />
        case 'multiple_response':
            return <MultipleResponseRenderer question={question} value={value} onChange={onChange} disabled={disabled} />
        case 'fill_in_blank':
            return <FillInBlankRenderer question={question} value={value} onChange={onChange} disabled={disabled} />
        // Other types will be added
        default:
            return (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 font-medium italic">
                    Loại câu hỏi "{question.type}" đang được phát triển
                </div>
            )
    }
}
