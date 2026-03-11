import { useParams, useNavigate } from "@tanstack/react-router"
import { useQuiz } from "../hooks/useQuizzes"
import { QuizPlayer } from "../components/Player"
import { Loader2 } from "lucide-react"

export function PlayerPage() {
    const { quizId } = useParams({ from: '/preview/$quizId' })
    const { data: quiz, isLoading, error } = useQuiz(quizId)
    const navigate = useNavigate()

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[110]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Đang tải câu hỏi...</p>
                </div>
            </div>
        )
    }

    if (error || !quiz) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center p-8 z-[110]">
                <div className="text-center space-y-6 max-w-sm">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <Loader2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài thi</h2>
                    <p className="text-xs text-slate-400 font-medium">Có lỗi xảy ra hoặc bài thi này không khả dụng. Vui lòng kiểm tra lại ID bài thi.</p>
                    <button
                        onClick={() => navigate({ to: '/dashboard' })}
                        className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
                    >
                        Quay lại Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <QuizPlayer
            quiz={quiz}
            isPreview={true}
            onClose={() => navigate({ to: '/quiz/$quizId', params: { quizId } })}
        />
    )
}
