import { useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { formatTime, isQuestionAnswered } from '@quizforge/quiz-engine'
import {
    Menu,
    ChevronLeft,
    ChevronRight,
    Timer,
    ShieldAlert,
    Send,
    Music,
    Clock
} from 'lucide-react'
import { MultipleChoicePlayer } from '../renderers/MultipleChoicePlayer'
import { TrueFalsePlayer } from '../renderers/TrueFalsePlayer'
import { MultipleResponsePlayer } from '../renderers/MultipleResponsePlayer'
import { FillInBlankPlayer } from '../renderers/FillInBlankPlayer'
import { MatchingPlayer } from '../renderers/MatchingPlayer'
import { SequencePlayer } from '../renderers/SequencePlayer'
import { WordBankPlayer } from '../renderers/WordBankPlayer'
import { ClickMapPlayer } from '../renderers/ClickMapPlayer'
import { ShortEssayPlayer } from '../renderers/ShortEssayPlayer'
import { BlankPagePlayer } from '../renderers/BlankPagePlayer'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import type { Question } from '@quizforge/types'
import { ask } from '@tauri-apps/plugin-dialog'

export function QuizPlayer() {
    useKeyboardNavigation()
    const {
        quiz,
        currentQuestionIndex,
        nextQuestion,
        prevQuestion,
        selectedStudent,
        outlinePanelOpen,
        toggleOutline,
        answers,
        questionResults,
        feedbackVisible,
        lastValidationResult,
        submitAnswer,
        submitAllAtOnce,
        finishQuiz,
        endReview,
        isSubmitting,
        phase,
        timeRemaining,
        questionTimeRemaining,
        tickTimer,
    } = usePlayerStore()

    const isAllAtOnce = quiz?.settings?.submission?.mode === 'all_at_once'

    // ── Timer interval ────────────────────────────────────────────────────────
    // Only start the interval when entering quiz phase and there is a time limit.
    // tickTimer reads current state via get() in the store, so it is safe to
    // reference it once here without putting timeRemaining in the deps array.
    useEffect(() => {
        if (phase !== 'quiz') return
        const state = usePlayerStore.getState()
        if (state.timeRemaining === null && state.questionTimeRemaining === null) return
        const id = setInterval(() => { tickTimer() }, 1000)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, tickTimer])

    const currentQuestion = quiz?.questions?.[currentQuestionIndex]
    const totalQuestions = quiz?.questions?.length ?? 0
    const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

    // ── Timer display ─────────────────────────────────────────────────────────
    const timerDisplay = timeRemaining === null ? '∞' : formatTime(timeRemaining)
    const timerColorClass =
        timeRemaining === null
            ? 'text-brand-200'
            : timeRemaining < 300
                ? 'text-red-400'
                : timeRemaining < 600
                    ? 'text-amber-300'
                    : 'text-brand-200'

    // ── Submit with unanswered-check ──────────────────────────────────────────
    const handleSubmitAnswer = async () => {
        if (!currentQuestion) return
        // blank_page is always "answered" — isQuestionAnswered handles it,
        // but blank_page uses the "Tiếp theo" path below, not this button.
        const answered = isQuestionAnswered(
            currentQuestion as unknown as Question,
            answers[currentQuestion.id]
        )
        if (!answered) {
            const confirmed = await ask('Bạn chưa chọn câu trả lời. Vẫn nộp không?', { title: 'Xác nhận nộp', kind: 'warning' })
            if (!confirmed) return
        }
        await submitAnswer()
    }

    const renderQuestion = () => {
        if (!currentQuestion) return null

        switch (currentQuestion.type) {
            case 'true_false': return <TrueFalsePlayer />
            case 'multiple_choice': return <MultipleChoicePlayer />
            case 'multiple_response': return <MultipleResponsePlayer />
            case 'fill_in_blank': return <FillInBlankPlayer />
            case 'matching': return <MatchingPlayer />
            case 'sequence': return <SequencePlayer />
            case 'word_bank': return <WordBankPlayer />
            case 'click_map': return <ClickMapPlayer />
            case 'short_essay': return <ShortEssayPlayer />
            case 'blank_page': return <BlankPagePlayer />
            default: return (
                <div className="p-12 text-center text-slate-300 italic">
                    Câu hỏi loại này đang được phát triển...
                </div>
            )
        }
    }

    const isBlankPage = currentQuestion?.type === 'blank_page'
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans select-none">
            {/* Header */}
            <header className="h-14 text-white flex items-center justify-between px-6 flex-shrink-0 z-20" style={{ backgroundColor: 'var(--qf-text)' }}>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black italic" style={{ color: 'var(--qf-primary)' }}>QF</div>
                    <div className="h-4 w-px bg-white/20 mx-2" />
                    <h2 className="text-sm font-black tracking-tight uppercase truncate max-w-sm">{quiz?.title}</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-500 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Chế độ kiểm tra</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {phase === 'reviewing' ? (
                        <div className="flex items-center gap-2 text-brand-200">
                            <span className="text-sm font-black font-mono">XEM LẠI</span>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-2 ${timerColorClass}`}>
                            <Timer className="w-4 h-4" />
                            <span className="text-sm font-black font-mono">{timerDisplay}</span>
                        </div>
                    )}
                    {phase === 'quiz' && questionTimeRemaining !== null && (
                        <div className="flex items-center gap-2 text-amber-300">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-black font-mono">{formatTime(questionTimeRemaining)}</span>
                        </div>
                    )}
                    <div className="h-4 w-px bg-white/20" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: 'var(--qf-primary)' }}>{selectedStudent?.class}</span>
                        <span className="text-xs font-bold leading-none">{selectedStudent?.name}</span>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-10 bg-white border-b border-slate-200 flex items-center px-6 gap-6 flex-shrink-0 z-10">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                        className="absolute inset-y-0 left-0 transition-all duration-500"
                        style={{ width: `${progress}%`, backgroundColor: 'var(--qf-primary)' }}
                    />
                </div>
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    <span>Câu {currentQuestionIndex + 1} / {totalQuestions}</span>
                    <div className="w-px h-3 bg-slate-200" />
                    <span className="font-bold" style={{ color: 'var(--qf-primary)' }}>{(currentQuestion?.points?.correct ?? 0)} ĐIỂM</span>
                </div>
            </div>

            {/* Dot Indicators */}
            {totalQuestions > 0 && totalQuestions <= 60 && (
                <div className="bg-white border-b border-slate-200 px-6 py-2 flex-shrink-0 z-10">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-3xl mx-auto">
                        {quiz?.questions?.map((q, i) => {
                            const isAnswered = !!answers[q.id]
                            const isCurrent = i === currentQuestionIndex
                            const result = questionResults[q.id]
                            const isReviewing = phase === 'reviewing'

                            let bg = 'bg-slate-200' // unanswered
                            let ring = ''
                            if (isReviewing && result) {
                                bg = result.is_correct ? 'bg-emerald-500' : 'bg-red-400'
                            } else if (isAnswered) {
                                bg = '' // will use inline style for primary color
                            }
                            if (isCurrent) {
                                ring = 'ring-2 ring-offset-1 ring-slate-800 scale-125'
                            }

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => usePlayerStore.getState().jumpToQuestion(i)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 hover:scale-150 ${bg} ${ring}`}
                                    style={!isReviewing && isAnswered && !isCurrent ? { backgroundColor: 'var(--qf-primary)' } : (isCurrent && !isReviewing ? { backgroundColor: 'var(--qf-primary)' } : {})}
                                    title={`Câu ${i + 1}`}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Main Question Area */}
            <main className={`flex-1 overflow-y-auto p-12 bg-slate-50/50 ${phase === 'reviewing' ? 'pointer-events-none' : ''}`}>
                <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {!isBlankPage && (
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--qf-primary-light)', color: 'var(--qf-primary)' }}>
                                {currentQuestion?.type?.replace(/_/g, ' ')}
                            </span>

                            {/* Media Renderer */}
                            {currentQuestion?.media && (
                                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                    {currentQuestion.media.type === 'image' && (
                                        <img
                                            src={currentQuestion.media.data.startsWith('data:') || currentQuestion.media.data.startsWith('http')
                                                ? currentQuestion.media.data
                                                : `data:${currentQuestion.media.mimeType};base64,${currentQuestion.media.data}`}
                                            alt={currentQuestion.media.filename || 'Hình ảnh câu hỏi'}
                                            className="max-h-64 w-auto mx-auto rounded-lg object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none'
                                            }}
                                        />
                                    )}
                                    {currentQuestion.media.type === 'audio' && (
                                        <div className="flex items-center gap-3 p-4">
                                            <Music className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                            <audio
                                                controls
                                                className="w-full"
                                                src={currentQuestion.media.data.startsWith('data:') || currentQuestion.media.data.startsWith('http')
                                                    ? currentQuestion.media.data
                                                    : `data:${currentQuestion.media.mimeType};base64,${currentQuestion.media.data}`}
                                            />
                                        </div>
                                    )}
                                    {currentQuestion.media.type === 'video' && (
                                        <video
                                            controls
                                            className="max-h-80 w-auto mx-auto"
                                            src={currentQuestion.media.data.startsWith('data:') || currentQuestion.media.data.startsWith('http')
                                                ? currentQuestion.media.data
                                                : `data:${currentQuestion.media.mimeType};base64,${currentQuestion.media.data}`}
                                        />
                                    )}
                                </div>
                            )}

                            <h3 className="text-2xl font-bold text-slate-800 leading-relaxed">
                                {currentQuestion?.text}
                            </h3>
                        </div>
                    )}

                    {/* Question Content Renderer */}
                    <div className="space-y-6">
                        {renderQuestion()}
                    </div>
                </div>
            </main>

            {/* Feedback Bar — Review Phase or Per-Question Mode */}
            {((!isAllAtOnce && feedbackVisible && lastValidationResult) || (phase === 'reviewing' && currentQuestion && questionResults[currentQuestion.id])) && (
                <div className={`h-[52px] flex items-center justify-between px-12 border-t-2 animate-in slide-in-from-bottom-2 ${(phase === 'reviewing' ? questionResults[currentQuestion!.id].is_correct : lastValidationResult!.is_correct)
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <div className="flex items-center gap-4">
                        <span className="font-black uppercase tracking-widest text-xs">
                            {(phase === 'reviewing' ? questionResults[currentQuestion!.id].is_correct : lastValidationResult!.is_correct) ? '✅ CHÍNH XÁC' : '❌ CHƯA ĐÚNG'}
                        </span>
                        <div className="w-px h-4 bg-black/10" />
                        <span className="text-sm font-medium">
                            {phase === 'reviewing'
                                ? (questionResults[currentQuestion!.id].is_correct ? currentQuestion!.feedback?.correct : currentQuestion!.feedback?.incorrect)
                                : (lastValidationResult!.is_correct ? lastValidationResult!.correct_feedback : lastValidationResult!.incorrect_feedback)
                            }
                        </span>
                    </div>
                    <div className="font-black font-mono">
                        +{(phase === 'reviewing' ? questionResults[currentQuestion!.id].points_earned : lastValidationResult!.points_earned)} ĐIỂM
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="h-16 bg-white border-t border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-20">
                <div className="flex gap-2">
                    <button
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="h-11 px-6 rounded-xl border-2 border-slate-100 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:border-brand-200 hover:text-brand-600 disabled:opacity-30 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" /> Câu trước
                    </button>
                    <button
                        onClick={toggleOutline}
                        className={`h-11 px-6 rounded-xl border-2 flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${outlinePanelOpen
                            ? 'text-white shadow-lg shadow-brand-200'
                            : 'border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                            }`}
                        style={outlinePanelOpen ? { backgroundColor: 'var(--qf-primary)', borderColor: 'var(--qf-primary)' } : {}}
                    >
                        <Menu className="w-4 h-4" /> Dàn bài
                    </button>
                </div>

                <div className="flex gap-3">
                    {phase === 'reviewing' ? (
                        <>
                            <button
                                onClick={endReview}
                                className="h-11 px-8 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                            >
                                Thoát xem lại
                            </button>
                            {!isLastQuestion && (
                                <button
                                    onClick={nextQuestion}
                                    className="h-11 px-8 rounded-xl bg-amber-500 text-white shadow-lg flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 pointer-events-auto"
                                >
                                    Tiếp theo <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    ) : isAllAtOnce ? (
                        <>
                            {!isLastQuestion && (
                                <button
                                    onClick={nextQuestion}
                                    className="h-11 px-8 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                                >
                                    Câu tiếp theo <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={submitAllAtOnce}
                                disabled={isSubmitting}
                                className="h-11 px-8 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200/50 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-60 transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4" /> Nộp bài thi
                            </button>
                        </>
                    ) : isBlankPage ? (
                        isLastQuestion ? (
                            <button
                                onClick={finishQuiz}
                                className="h-11 px-8 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200/50 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95"
                            >
                                Nộp bài thi
                            </button>
                        ) : (
                            <button
                                onClick={nextQuestion}
                                className="h-11 px-8 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                            >
                                Tiếp theo <ChevronRight className="w-4 h-4" />
                            </button>
                        )
                    ) : !feedbackVisible ? (
                        /* Normal question: submit button */
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={isSubmitting}
                            className="h-11 px-8 rounded-xl text-white shadow-lg shadow-brand-200/50 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-60 transition-all active:scale-95"
                            style={{ backgroundColor: 'var(--qf-primary)' }}
                        >
                            <Send className="w-4 h-4" /> Nộp câu trả lời
                        </button>
                    ) : isLastQuestion ? (
                        /* After feedback on last question: finish */
                        <button
                            onClick={finishQuiz}
                            className="h-11 px-8 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200/50 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95"
                        >
                            Nộp bài thi
                        </button>
                    ) : (
                        /* After feedback on non-last question: next */
                        <button
                            onClick={nextQuestion}
                            className="h-11 px-8 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                        >
                            Câu tiếp theo <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </footer>

            {/* Outline Panel Overlay */}
            {outlinePanelOpen && (
                <div
                    className="absolute inset-x-0 bottom-16 bg-black/5 z-30 animate-in fade-in duration-300"
                    onClick={toggleOutline}
                >
                    <div
                        className="absolute left-6 bottom-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in slide-in-from-bottom-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Danh sách câu hỏi</h4>
                        <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {quiz?.questions?.map((q, i) => (
                                <button
                                    key={q.id}
                                    onClick={() => {
                                        usePlayerStore.getState().jumpToQuestion(i)
                                        toggleOutline()
                                    }}
                                    className={`w-full aspect-square rounded-xl flex items-center justify-center font-black text-xs transition-all ${i === currentQuestionIndex
                                        ? 'text-white shadow-lg shadow-brand-200 scale-110 z-10'
                                        : answers[q.id]
                                            ? ''
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                    style={{
                                        ...(i === currentQuestionIndex ? { backgroundColor: 'var(--qf-primary)' } : {}),
                                        ...(i !== currentQuestionIndex && answers[q.id] ? { backgroundColor: 'var(--qf-primary-light)', color: 'var(--qf-primary)' } : {})
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
