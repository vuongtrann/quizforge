import { usePlayerStore } from '../store/playerStore'
import type { QuizQuestion } from '../store/playerStore'
import {
    CheckCircle2,
    XCircle,
    Clock,
    BarChart3,
    RotateCcw,
    Check
} from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function ResultScreen() {
    const quiz = usePlayerStore(s => s.quiz)
    const selectedStudent = usePlayerStore(s => s.selectedStudent)
    const startTime = usePlayerStore(s => s.startTime)
    const questionResults = usePlayerStore(s => s.questionResults)
    const startReview = usePlayerStore(s => s.startReview)

    if (!quiz) return null

    const gradableQuestions = quiz.questions.filter((q: QuizQuestion) => q.type !== 'blank_page')

    const maxPoints = gradableQuestions.reduce((sum: number, q: QuizQuestion) => sum + (q.points?.correct ?? 0), 0)
    const earnedPoints = Object.values(questionResults).reduce((sum, r) => sum + r.points_earned, 0)
    const correctCount = Object.values(questionResults).filter(r => r.is_correct).length
    const answeredCount = Object.keys(questionResults).length
    const submitRate = gradableQuestions.length > 0
        ? Math.round((answeredCount / gradableQuestions.length) * 100)
        : 0

    const scorePercent = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0
    const passingRate: number = quiz?.settings?.passingRate ?? 80
    const passed = scorePercent >= passingRate

    const elapsedMs = startTime ? Date.now() - startTime : 0

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden p-12 space-y-12 animate-in fade-in zoom-in-95 duration-700" style={{ borderRadius: 'calc(var(--qf-radius) * 2)' }}>
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 flex items-center justify-center mx-auto shadow-xl" style={{ backgroundColor: 'var(--qf-primary-light)', color: 'var(--qf-primary)', borderRadius: 'calc(var(--qf-radius) + 0.5rem)' }}>
                        {passed ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12 text-red-500" />}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">
                            {passed ? 'BÀI THI HOÀN TẤT!' : 'KẾT QUẢ CHƯA ĐẠT'}
                        </h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            {selectedStudent?.name}{selectedStudent?.className ? ` • ${selectedStudent.className}` : ''}
                        </p>
                    </div>
                </div>

                {/* Score Circle */}
                <div className="relative w-48 h-48 mx-auto">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="96" cy="96" r="88"
                            className="stroke-slate-100"
                            strokeWidth="16" fill="transparent"
                        />
                        <circle
                            cx="96" cy="96" r="88"
                            className="transition-all duration-1000"
                            style={passed ? { stroke: 'var(--qf-primary)' } : { stroke: '#ef4444' }} // red-500 for failed
                            strokeWidth="16" fill="transparent"
                            strokeDasharray={552}
                            strokeDashoffset={552 - (552 * scorePercent) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-800 tracking-tight">{earnedPoints}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            / {maxPoints} ĐIỂM
                        </span>
                        <span className="text-sm font-bold mt-1" style={{ color: 'var(--qf-primary)' }}>{scorePercent}%</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-6 bg-slate-50 space-y-1 text-center border border-slate-100" style={{ borderRadius: 'calc(var(--qf-radius) + 0.5rem)' }}>
                    <Clock className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thời gian</p>
                    <p className="text-lg font-black text-slate-800">{formatTime(elapsedMs)}</p>
                </div>
                <div className="p-6 bg-slate-50 space-y-1 text-center border border-slate-100" style={{ borderRadius: 'calc(var(--qf-radius) + 0.5rem)' }}>
                    <BarChart3 className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Số câu đúng</p>
                    <p className="text-lg font-black text-green-600">{correctCount}/{gradableQuestions.length}</p>
                </div>
                <div className="p-6 bg-slate-50 space-y-1 text-center border border-slate-100" style={{ borderRadius: 'calc(var(--qf-radius) + 0.5rem)' }}>
                    <RotateCcw className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tỷ lệ nộp</p>
                    <p className="text-lg font-black" style={{ color: 'var(--qf-primary)' }}>{submitRate}%</p>
                </div>

                {/* Pass/Fail Message */}
                {(() => {
                    const message = passed
                        ? (quiz.settings?.result?.passMessage ?? quiz.resultSettings?.passMessage ?? '')
                        : (quiz.settings?.result?.failMessage ?? quiz.resultSettings?.failMessage ?? '')
                    if (!message) return null
                    return (
                        <div
                            className={`p-6 border text-center prose prose-sm max-w-none ${passed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}
                            style={{ borderRadius: 'calc(var(--qf-radius) + 0.5rem)' }}
                            dangerouslySetInnerHTML={{ __html: message }}
                        />
                    )
                })()}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                {quiz.settings?.submission?.allowReview && (
                    <button
                        className="flex-1 h-16 border-2 border-slate-100 bg-white font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                        style={{ borderRadius: 'var(--qf-radius)' }}
                        onClick={startReview}
                    >
                        <BarChart3 className="w-5 h-5" /> Xem lại bài làm
                    </button>
                )}
                <button
                    className="flex-1 h-16 bg-brand-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-200/50 hover:brightness-110 hover:shadow-brand-300/50 transition-all flex items-center justify-center gap-3 active:scale-95"
                    style={{ borderRadius: 'var(--qf-radius)', backgroundColor: 'var(--qf-primary)' }}
                    onClick={async () => {
                        const redirectUrl = passed 
                            ? (quiz.settings?.result?.finishButton?.passUrl ?? quiz.resultSettings?.finishButton?.passUrl)
                            : (quiz.settings?.result?.finishButton?.failUrl ?? quiz.resultSettings?.finishButton?.failUrl)
                        if (redirectUrl) {
                            try {
                                const { openUrl } = await import('@tauri-apps/plugin-opener')
                                await openUrl(redirectUrl)
                            } catch (err) {
                                console.error('Failed to open redirect URL:', err)
                            }
                        }
                        await invoke('force_quit')
                    }}
                >
                    <Check className="w-5 h-5" /> Hoàn tất bài thi
                </button>
            </div>
        </div>
    )
}
