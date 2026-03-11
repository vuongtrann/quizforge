import { usePlayerStore } from '../store/playerStore'
import type { QuizQuestion } from '../store/playerStore'

export function ShortEssayPlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer } = usePlayerStore()
    const question: QuizQuestion | undefined = quiz?.questions?.[currentQuestionIndex]

    if (!question || question.type !== 'short_essay') return null

    const text = (answers[question.id] as string) || ''
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
    const maxWords: number | undefined = question.maxWords

    return (
        <div className="space-y-4">
            <textarea
                value={text}
                onChange={(e) => setAnswer(question.id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn tại đây..."
                className="w-full h-64 p-8 rounded-3xl border-2 border-white bg-white shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all text-slate-700 font-medium leading-relaxed resize-none"
            />
            <div className="flex justify-between items-center px-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Sử dụng phím Enter để xuống dòng
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${maxWords && wordCount > maxWords ? 'text-red-500' : 'text-brand-600'}`}>
                    {wordCount} từ{maxWords ? ` / ${maxWords} từ tối đa` : ''}
                </span>
            </div>
        </div>
    )
}
