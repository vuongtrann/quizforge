import { useState, useEffect } from "react"
import { Quiz } from "@quizforge/types"
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    LayoutList,
    Play,
    Award,
    CheckCircle2,
    User,
    Lock,
    LogOut,
    AlertCircle
} from "lucide-react"
import { QuestionRenderer } from "./questions/QuestionRenderer"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

interface PlayerProps {
    quiz: Quiz
    isPreview?: boolean
    onFinish?: (result: any) => void
    onClose?: () => void
}

type PlayerPhase = 'intro' | 'security' | 'collect' | 'quiz' | 'result'

export function QuizPlayer({ quiz, onFinish, onClose }: PlayerProps) {
    const [phase, setPhase] = useState<PlayerPhase>('intro')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [startTime, setStartTime] = useState<number | null>(null)
    const [timeLeft, setLeftTime] = useState(0)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [participantData, setParticipantData] = useState({ name: "", className: "", studentId: "" })
    const [passwordInput, setPasswordInput] = useState("")
    const [securityError, setSecurityError] = useState("")

    const branding = quiz.information.branding
    const theme = quiz.theme
    const questions = quiz.questions.filter(q => q.type !== 'blank_page')
    const totalQuestions = questions.length

    useEffect(() => {
        // Pre-check skip logic
        if (phase === 'intro' && !quiz.information.introduction.enabled) {
            goToNextPhaseFrom('intro')
        }
    }, [phase, quiz])

    const goToNextPhaseFrom = (current: PlayerPhase) => {
        if (current === 'intro') {
            if (quiz.security.protection !== 'none') setPhase('security')
            else if (quiz.information.collectParticipantData.enabled) setPhase('collect')
            else startQuiz()
        } else if (current === 'security') {
            if (quiz.information.collectParticipantData.enabled) setPhase('collect')
            else startQuiz()
        } else if (current === 'collect') {
            startQuiz()
        }
    }

    const startQuiz = () => {
        setPhase('quiz')
        setStartTime(Date.now())
        if (quiz.settings.timeLimit.enabled) {
            setLeftTime(quiz.settings.timeLimit.durationSeconds)
        }
    }

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (phase === 'quiz' && quiz.settings.timeLimit.enabled && timeLeft > 0) {
            interval = setInterval(() => {
                setLeftTime(t => t - 1)
            }, 1000)
        } else if (timeLeft === 0 && phase === 'quiz' && quiz.settings.timeLimit.enabled) {
            finishQuiz()
        }
        return () => clearInterval(interval)
    }, [phase, timeLeft, quiz.settings.timeLimit.enabled])

    const finishQuiz = () => {
        setPhase('result')
        if (onFinish) onFinish({ answers, timeSpent: startTime ? Date.now() - startTime : 0 })
    }

    const checkPassword = () => {
        if (passwordInput === quiz.security.password) {
            goToNextPhaseFrom('security')
        } else {
            setSecurityError("Mật khẩu không chính xác")
        }
    }

    const currentQuestion = questions[currentQuestionIndex]

    if (phase === 'intro') {
        const bgStyle = branding?.backgroundMode === 'gradient'
            ? { background: branding.backgroundGradient }
            : branding?.backgroundMode === 'color'
                ? { backgroundColor: branding.backgroundColor }
                : { backgroundColor: '#f8fafc' }

        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 overflow-y-auto transition-all duration-700" style={bgStyle}>
                <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${theme.primaryColor}, transparent)` }} />
                        <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-slate-800 shadow-xl overflow-hidden" style={{ border: `4px solid ${theme.primaryColor}` }}>
                            {branding?.logo ? (
                                <img src={branding.logo} className="w-full h-full object-contain p-2" alt="Logo" />
                            ) : (
                                <Play className="w-10 h-10 ml-1 fill-current" style={{ color: theme.primaryColor }} />
                            )}
                        </div>
                    </div>
                    <div className="p-10 space-y-6 text-center">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 mb-2 leading-tight uppercase tracking-tighter">{quiz.information.title}</h1>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{branding?.orgName || quiz.information.author || 'Tác giả chưa rõ'}</p>
                        </div>
                        <div className="max-w-md mx-auto py-6 border-y border-slate-50 text-slate-600 text-sm leading-relaxed font-medium">
                            {quiz.information.description || 'Vui lòng làm theo hướng dẫn trong bài thi. Chúc bạn đạt kết quả tốt nhất.'}
                        </div>
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                                <p className="text-sm font-black text-slate-700">{quiz.settings.timeLimit.enabled ? `${Math.floor(quiz.settings.timeLimit.durationSeconds / 60)} phút` : 'Không giới hạn'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số câu hỏi</p>
                                <p className="text-sm font-black text-slate-700">{totalQuestions} câu</p>
                            </div>
                        </div>
                        <Button
                            className="w-full max-w-xs h-16 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                            style={{ backgroundColor: theme.primaryColor }}
                            onClick={() => goToNextPhaseFrom('intro')}
                        >
                            Bắt đầu bài thi
                        </Button>
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4 opacity-60">
                    <span>{branding?.footerText || "Powered by QuizForce Professional"}</span>
                    {!branding?.removeBranding && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>PHÁT TRIỂN BỞI QUIZFORCE</span>
                        </>
                    )}
                </div>
            </div>
        )
    }

    if (phase === 'security') {
        return (
            <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-md bg-white rounded-[2rem] p-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">Yêu cầu bảo mật</h2>
                        <p className="text-xs text-slate-400 font-medium">Bạn cần nhập mã bảo vệ để có quyền truy cập bài thi này.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="password"
                                className={cn(
                                    "w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-mono tracking-[0.5em] focus:bg-white focus:ring-1 transition-all outline-none",
                                    securityError ? "border-red-300 ring-1 ring-red-50" : "focus:ring-brand-500"
                                )}
                                placeholder="••••••"
                                value={passwordInput}
                                autoFocus
                                onChange={(e) => {
                                    setPasswordInput(e.target.value)
                                    setSecurityError("")
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                            />
                            {securityError && (
                                <p className="text-[10px] text-red-500 font-bold text-center mt-2 animate-bounce">{securityError}</p>
                            )}
                        </div>
                        <Button
                            className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest shadow-lg"
                            style={{ backgroundColor: theme.primaryColor }}
                            onClick={checkPassword}
                        >
                            Xác thực truy cập
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (phase === 'collect') {
        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Thông tin định danh</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Vui lòng hoàn thành để hệ thống lưu kết quả</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Họ và tên thí sinh</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input
                                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                                    placeholder="Ví dụ: Nguyễn Văn Hải"
                                    value={participantData.name}
                                    autoFocus
                                    onChange={(e) => setParticipantData({ ...participantData, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Lớp</label>
                                <input
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                                    placeholder="10A1"
                                    value={participantData.className}
                                    onChange={(e) => setParticipantData({ ...participantData, className: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mã học sinh</label>
                                <input
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                                    placeholder="HS12345"
                                    value={participantData.studentId}
                                    onChange={(e) => setParticipantData({ ...participantData, studentId: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest mt-4 shadow-xl"
                            style={{ backgroundColor: theme.primaryColor }}
                            disabled={!participantData.name}
                            onClick={() => goToNextPhaseFrom('collect')}
                        >
                            Vào thi ngay
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (phase === 'quiz') {
        const formatTime = (s: number) => {
            const h = Math.floor(s / 3600)
            const m = Math.floor((s % 3600) / 60)
            const sec = s % 60
            return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${sec.toString().padStart(2, '0')}`
        }

        return (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.fontFamily }}>
                {/* Header */}
                <header className="h-14 bg-white border-b flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md shadow-brand-200" style={{ backgroundColor: theme.primaryColor }}>
                            <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </div>
                        <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{quiz.information.title}</h1>
                        <div className="h-4 w-px bg-slate-200 mx-2" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{participantData.name || 'Thí sinh tự do'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {quiz.settings.timeLimit.enabled && (
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold border transition-all",
                                timeLeft < 60 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-slate-50 border-slate-100 text-slate-500"
                            )}>
                                <Clock className="w-4 h-4" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 rounded-xl p-0 hover:bg-red-50 hover:text-red-500">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </header>

                {/* Progress Bar */}
                <div className="px-6 py-2 pt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Câu hỏi {currentQuestionIndex + 1}/{totalQuestions}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.primaryColor }}>{Math.round((Object.keys(answers).length / totalQuestions) * 100)}% hoàn thành</span>
                    </div>
                    {theme.progressStyle === 'bar' && (
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-500" style={{ backgroundColor: theme.primaryColor, width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }} />
                        </div>
                    )}
                    {theme.progressStyle === 'dots' && (
                        <div className="flex gap-1 justify-center">
                            {questions.map((_, i) => (
                                <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === currentQuestionIndex ? "w-4" : "")} style={{ backgroundColor: i === currentQuestionIndex ? theme.primaryColor : (answers[questions[i].id] ? `${theme.primaryColor}50` : '#e2e8f0') }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Layout (Split with optional sidebar) */}
                <div className="flex-1 flex overflow-hidden relative">
                    <main className="flex-1 overflow-y-auto px-6 py-8 flex items-center justify-center">
                        <div className="w-full max-w-2xl bg-white rounded-3xl p-10 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Question Content */}
                            <div className="space-y-8">
                                <div className="space-y-4 text-center">
                                    <h2 className="text-xl font-bold text-slate-800 leading-relaxed" style={{ fontSize: `${theme.fontSize}px` }}>{currentQuestion.text}</h2>
                                    {currentQuestion.media && (
                                        <div className="max-w-md mx-auto aspect-video rounded-2xl bg-slate-50 border overflow-hidden">
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <AlertCircle className="w-8 h-8 opacity-20" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Real Renderer */}
                                <div className="py-2 min-h-[280px] flex items-center justify-center">
                                    <QuestionRenderer
                                        question={currentQuestion}
                                        value={answers[currentQuestion.id]}
                                        onChange={(val) => setAnswers({ ...answers, [currentQuestion.id]: val })}
                                    />
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Sidebar navigation */}
                    <aside className={cn(
                        "absolute top-0 right-0 h-full w-72 bg-white border-l shadow-2xl transition-transform duration-300 z-20 flex flex-col",
                        isSidebarOpen ? "translate-x-0" : "translate-x-full"
                    )}>
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Danh sách câu hỏi</h4>
                            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 p-0"><ChevronRight className="w-4 h-4" /></Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, i) => (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            setCurrentQuestionIndex(i)
                                            setIsSidebarOpen(false)
                                        }}
                                        className={cn(
                                            "aspect-square rounded-xl border flex items-center justify-center text-[10px] font-bold transition-all",
                                            i === currentQuestionIndex ? "border-brand-500 bg-brand-500 text-white shadow-lg" : (answers[q.id] ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300")
                                        )}
                                        style={{ backgroundColor: i === currentQuestionIndex ? theme.primaryColor : undefined, borderColor: i === currentQuestionIndex ? theme.primaryColor : undefined }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Footer Navigation */}
                <footer className="h-20 bg-white border-t flex items-center justify-between px-10 flex-shrink-0 z-10 shadow-up">
                    <div className="flex items-center gap-4">
                        {theme.navigationStyle === 'sidebar' && (
                            <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(true)} className="rounded-xl border-slate-200 gap-2 h-11 px-6 shadow-sm">
                                <LayoutList className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Outline</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(i => i - 1)}
                            className="rounded-xl gap-2 h-11 px-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                        >
                            <ChevronLeft className="w-4 h-4" /> Quay lại
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <Button
                                className="rounded-xl gap-2 h-11 px-10 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-brand-500/20"
                                style={{ backgroundColor: theme.primaryColor }}
                                onClick={() => setCurrentQuestionIndex(i => i + 1)}
                            >
                                Câu tiếp theo <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                className="rounded-xl gap-2 h-11 px-10 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700"
                                onClick={finishQuiz}
                            >
                                <CheckCircle2 className="w-4 h-4" /> Hoàn thành bài thi
                            </Button>
                        )}
                    </div>
                </footer>
            </div>
        )
    }

    if (phase === 'result') {
        return (
            <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-700">
                    <div className="h-4 bg-emerald-500" />
                    <div className="p-12 space-y-10 text-center">
                        <div className="space-y-4">
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border-4 border-emerald-100 shadow-xl animate-bounce-once">
                                <Award className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Kết quả bài thi</h2>
                            <p className="text-slate-500 font-medium px-8 leading-relaxed italic">{quiz.result.passMessage}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Điểm số</p>
                                <p className="text-3xl font-black text-slate-800 tracking-tighter">80%</p>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: '80%' }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center justify-between p-4 px-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Đúng</span>
                                    <span className="text-lg font-black text-emerald-700">8</span>
                                </div>
                                <div className="flex items-center justify-between p-4 px-6 bg-red-50/50 rounded-2xl border border-red-100">
                                    <span className="text-[10px] font-bold text-red-800 uppercase">Sai</span>
                                    <span className="text-lg font-black text-red-700">2</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <Button
                                className="w-full max-w-xs h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl flex gap-3 transition-all active:scale-95"
                                variant="default"
                                style={{ backgroundColor: theme.primaryColor }}
                                onClick={onClose}
                            >
                                <LogOut className="w-4 h-4" /> Thoát & Đóng lại
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
