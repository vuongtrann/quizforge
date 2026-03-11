import { TrueFalseQuestion } from "@quizforge/types"

interface TrueFalseEditorProps {
    question: TrueFalseQuestion
    onChange: (question: TrueFalseQuestion) => void
}

export function TrueFalseEditor({ question, onChange }: TrueFalseEditorProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2 uppercase tracking-wide">
                Câu trả lời đúng
            </div>
            <div className="flex gap-4">
                <label
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${question.correctAnswer === 'true' ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'hover:bg-slate-50'
                        }`}
                >
                    <input
                        type="radio"
                        name="tf-correct"
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        checked={question.correctAnswer === 'true'}
                        onChange={() => onChange({ ...question, correctAnswer: 'true' })}
                    />
                    <span className={`font-bold ${question.correctAnswer === 'true' ? 'text-emerald-700' : 'text-slate-600'}`}>
                        ĐÚNG
                    </span>
                </label>
                <label
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${question.correctAnswer === 'false' ? 'bg-red-50 border-red-500 shadow-sm' : 'hover:bg-slate-50'
                        }`}
                >
                    <input
                        type="radio"
                        name="tf-correct"
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                        checked={question.correctAnswer === 'false'}
                        onChange={() => onChange({ ...question, correctAnswer: 'false' })}
                    />
                    <span className={`font-bold ${question.correctAnswer === 'false' ? 'text-red-700' : 'text-slate-600'}`}>
                        SAI
                    </span>
                </label>
            </div>
        </div>
    )
}
