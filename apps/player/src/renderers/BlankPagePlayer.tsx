import { usePlayerStore } from '../store/playerStore'
import type { QuizQuestion } from '../store/playerStore'

export function BlankPagePlayer() {
    const { quiz, currentQuestionIndex } = usePlayerStore()
    const question: QuizQuestion | undefined = quiz?.questions?.[currentQuestionIndex]

    if (!question || question.type !== 'blank_page') return null

    return (
        <div className="bg-white p-12 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-8 min-h-[400px]">
            {question.richText && (
                <div
                    className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: question.richText }}
                />
            )}
            {!question.richText && (
                <div className="flex items-center justify-center p-20 border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-xs italic">Trang trắng (Thông tin)</p>
                </div>
            )}
        </div>
    )
}
