import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import {
    FileText, FileSpreadsheet, FolderOpen, ClipboardList,
    LifeBuoy, Radio, Settings, AlertCircle, Plus,
    ChevronRight, BookOpen, ArrowUpRight,
} from 'lucide-react'
import { useCreateQuiz, useQuizzes, useImportQuizFile } from '../hooks/useQuizzes'
import { ImportExcelDialog } from '../components/ImportExcelDialog'

export function WelcomeScreen() {
    const navigate = useNavigate()
    const createQuiz = useCreateQuiz()
    const { data: recentQuizzes = [] } = useQuizzes()
    const [createError, setCreateError] = useState<string | null>(null)
    const [showImportExcel, setShowImportExcel] = useState(false)
    const importQuiz = useImportQuizFile()

    const handleCreateNew = async () => {
        setCreateError(null)
        try {
            const quiz = await createQuiz.mutateAsync({ title: 'Untitled Quiz' })
            navigate({ to: '/quiz/$quizId', params: { quizId: quiz.id } })
        } catch (err) {
            setCreateError(String(err))
        }
    }

    const handleImportQfz = async () => {
        setCreateError(null)
        try {
            const selected = await openFileDialog({ multiple: false, filters: [{ name: 'QuizForge File', extensions: ['qfz'] }] })
            if (selected && typeof selected === 'string') {
                const quiz = await importQuiz.mutateAsync(selected)
                navigate({ to: '/quiz/$quizId', params: { quizId: quiz.id } })
            }
        } catch (err) {
            setCreateError(String(err))
        }
    }

    const recent = recentQuizzes.slice(0, 6)

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-app)' }}>
            {/* Error banner */}
            {createError && (
                <div className="flex items-center gap-2 mx-6 mt-4 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-xl flex-shrink-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{createError}</span>
                    <button onClick={() => setCreateError(null)} className="text-red-300 hover:text-red-500 text-lg leading-none">&times;</button>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-auto px-10 py-8">
                {/* App title */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: 'var(--accent)' }}>
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>QuizForge Creator</h1>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Phần mềm tạo bài kiểm tra</p>
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="flex gap-8 max-w-[960px]">
                    {/* Column 1: Actions */}
                    <div className="flex flex-col gap-4" style={{ width: 250 }}>
                        {/* Tạo mới */}
                        <div className="ui-card py-1.5">
                            <p className="ui-section-label">Tạo mới</p>
                            <div className="px-1.5 pb-1">
                                <button onClick={handleCreateNew} className="ws-action-item" disabled={createQuiz.isPending}>
                                    <span className="ws-action-item-icon" style={{ background: 'var(--accent)' }}>
                                        <Plus className="w-3.5 h-3.5 text-white" />
                                    </span>
                                    <span className="font-medium">{createQuiz.isPending ? 'Đang tạo...' : 'Tạo Quiz mới'}</span>
                                </button>
                                <button onClick={() => setShowImportExcel(true)} className="ws-action-item">
                                    <span className="ws-action-item-icon bg-blue-50"><FileText className="w-3.5 h-3.5 text-blue-500" /></span>
                                    Từ Word
                                </button>
                                <button onClick={() => setShowImportExcel(true)} className="ws-action-item">
                                    <span className="ws-action-item-icon bg-emerald-50"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /></span>
                                    Từ Excel
                                </button>
                            </div>
                        </div>

                        {/* Mở */}
                        <div className="ui-card py-1.5">
                            <p className="ui-section-label">Mở</p>
                            <div className="px-1.5 pb-1">
                                <Link to="/dashboard" className="ws-action-item">
                                    <span className="ws-action-item-icon bg-amber-50"><FolderOpen className="w-3.5 h-3.5 text-amber-500" /></span>
                                    Tất cả Quiz (Dashboard)
                                </Link>
                                <button onClick={handleImportQfz} className="ws-action-item" disabled={importQuiz.isPending}>
                                    <span className="ws-action-item-icon bg-violet-50"><FileText className="w-3.5 h-3.5 text-violet-500" /></span>
                                    {importQuiz.isPending ? 'Đang nạp...' : 'Import .qfz'}
                                </button>
                            </div>
                        </div>

                        {/* Công cụ */}
                        <div className="ui-card py-1.5">
                            <p className="ui-section-label">Công cụ</p>
                            <div className="px-1.5 pb-1">
                                <Link to="/receive" className="ws-action-item">
                                    <span className="ws-action-item-icon bg-rose-50"><Radio className="w-3.5 h-3.5 text-rose-500" /></span>
                                    Nhận bài (Receive Mode)
                                </Link>
                                <Link to="/settings" className="ws-action-item">
                                    <span className="ws-action-item-icon" style={{ background: 'var(--bg-app)' }}>
                                        <Settings className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                                    </span>
                                    Thiết lập
                                </Link>
                            </div>
                        </div>

                        {/* Survey (coming soon) */}
                        <div className="ui-card py-1.5 opacity-50">
                            <p className="ui-section-label">Survey</p>
                            <div className="px-1.5 pb-1">
                                <button className="ws-action-item cursor-not-allowed" disabled>
                                    <span className="ws-action-item-icon bg-purple-50"><ClipboardList className="w-3.5 h-3.5 text-purple-400" /></span>
                                    Tạo Survey (sắp có)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Recent quizzes */}
                    <div className="flex-1">
                        <div className="ui-card overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3.5">
                                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Gần đây
                                </h2>
                                <Link to="/dashboard" className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: 'var(--accent-text)' }}>
                                    Xem tất cả <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {recent.length === 0 ? (
                                <div className="py-16 flex flex-col items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                                        <FileText className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Chưa có Quiz nào</p>
                                        <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>Hãy tạo quiz đầu tiên của bạn</p>
                                    </div>
                                    <button onClick={handleCreateNew}
                                        className="text-xs font-medium px-4 py-2 rounded-lg text-white transition-all active:scale-[0.98]"
                                        style={{ background: 'var(--accent)' }}>
                                        + Tạo Quiz đầu tiên
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {recent.map((quiz, i) => (
                                        <Link
                                            key={quiz.id}
                                            to="/quiz/$quizId"
                                            params={{ quizId: quiz.id }}
                                            className="flex items-center gap-4 px-5 py-3.5 transition-colors group"
                                            style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : undefined }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-alt)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)' }}>
                                                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{quiz.title}</p>
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                    {quiz.questionCount} câu · {quiz.totalPoints} điểm
                                                </p>
                                            </div>
                                            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--text-disabled)' }}>
                                                {quiz.updatedAt}
                                            </span>
                                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-10 h-7 flex-shrink-0 text-[11px]" style={{ color: 'var(--text-disabled)' }}>
                <div className="flex items-center gap-6">
                    <button className="hover:opacity-70 transition-opacity">Cộng đồng</button>
                    <button className="hover:opacity-70 transition-opacity">Xem mẫu</button>
                    <button className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                        <LifeBuoy className="w-3 h-3" /> Hỗ trợ
                    </button>
                </div>
                <span>QuizForge Creator 2026</span>
            </div>

            <ImportExcelDialog
                open={showImportExcel}
                onClose={() => setShowImportExcel(false)}
                onSuccess={(quizId) => navigate({ to: '/quiz/$quizId', params: { quizId } })}
            />
        </div>
    )
}
