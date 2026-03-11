/**
 * Dashboard — Main screen of QuizForge Creator (D2)
 * Tab 1: Quản lý Quiz (quiz list with grid/list view)
 * Tab 2: Giám sát lớp học (real-time student monitor)
 */
import { useState } from 'react'
import { open, save } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import {
    FileText, Plus, FolderOpen, Search, LayoutGrid, List,
    Settings, Radio, Users, CheckCircle, Activity, AlertTriangle,
    AlertCircle, RefreshCw, MoreVertical, Copy,
    Trash2, Download, Edit, ArrowLeft, FileSpreadsheet,
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/appStore'
import {
    useQuizzes, useCreateQuiz, useDeleteQuiz,
    useDuplicateQuiz, useImportQuizFile, useExportQuizFile
} from '../hooks/useQuizzes'
import { ImportExcelDialog } from '../components/ImportExcelDialog'
import { useMonitor } from '../hooks/useMonitor'
import { type StudentMonitorData } from '../hooks/useMonitor'
import { type QuizSummary } from '@quizforge/types'

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.1.0'

// ─── QuizCard ───

function QuizCard({ quiz, onDuplicate, onDelete, onExport }: {
    quiz: QuizSummary
    onDuplicate: (id: string) => void
    onDelete: (id: string) => void
    onExport: (quiz: QuizSummary) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    return (
        <Link
            to="/quiz/$quizId"
            params={{ quizId: quiz.id }}
            className="ui-card ui-card-hover group relative p-5 w-[240px] cursor-pointer block"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                    <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)]"
                >
                    <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                </button>
            </div>

            <h3 className="text-sm font-semibold line-clamp-2 mb-1.5 leading-snug" style={{ color: 'var(--text-primary)' }}>
                {quiz.title}
            </h3>

            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>{quiz.questionCount} câu</span>
                <span style={{ color: 'var(--text-disabled)' }}>&middot;</span>
                <span>{quiz.totalPoints} điểm</span>
            </div>

            <div className="mt-4 text-[11px]" style={{ color: 'var(--text-disabled)' }}>
                {quiz.updatedAt}
            </div>

            {menuOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setMenuOpen(false) }} />
                    <div className="absolute right-2 top-12 z-20 w-44 py-1.5 ui-card" style={{ boxShadow: 'var(--shadow-lg)' }}>
                        <Link to="/quiz/$quizId" params={{ quizId: quiz.id }}
                            className="w-full px-3 py-2 flex items-center gap-2.5 text-xs font-medium transition-colors hover:bg-[var(--bg-app)] rounded-md"
                            style={{ color: 'var(--text-secondary)' }}>
                            <Edit className="w-3.5 h-3.5" /> Mở
                        </Link>
                        <button onClick={(e) => { e.preventDefault(); onDuplicate(quiz.id); setMenuOpen(false) }}
                            className="w-full px-3 py-2 flex items-center gap-2.5 text-xs font-medium transition-colors hover:bg-[var(--bg-app)] rounded-md"
                            style={{ color: 'var(--text-secondary)' }}>
                            <Copy className="w-3.5 h-3.5" /> Nhân bản
                        </button>
                        <button onClick={(e) => { e.preventDefault(); onExport(quiz); setMenuOpen(false) }}
                            className="w-full px-3 py-2 flex items-center gap-2.5 text-xs font-medium transition-colors hover:bg-[var(--bg-app)] rounded-md"
                            style={{ color: 'var(--text-secondary)' }}>
                            <Download className="w-3.5 h-3.5" /> Xuất .qfz
                        </button>
                        <div className="my-1 mx-2" style={{ borderTop: '1px solid var(--border)' }} />
                        <button onClick={(e) => { e.preventDefault(); onDelete(quiz.id); setMenuOpen(false) }}
                            className="w-full px-3 py-2 flex items-center gap-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors rounded-md">
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                    </div>
                </>
            )}
        </Link>
    )
}

// ─── QuizListRow ───

function QuizListRow({ quiz, onDuplicate, onDelete, onExport }: {
    quiz: QuizSummary
    onDuplicate: (id: string) => void
    onDelete: (id: string) => void
    onExport: (quiz: QuizSummary) => void
}) {
    return (
        <tr className="group transition-colors cursor-pointer" style={{ borderBottom: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-alt)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
            <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{quiz.title}</span>
                </div>
            </td>
            <td className="px-5 py-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{quiz.questionCount}</td>
            <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{quiz.createdAt}</td>
            <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{quiz.updatedAt}</td>
            <td className="px-5 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to="/quiz/$quizId" params={{ quizId: quiz.id }}
                        className="p-1.5 rounded-md transition-colors" title="Mở"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-app)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <Edit className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(quiz.id) }}
                        className="p-1.5 rounded-md transition-colors" title="Nhân bản"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-app)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onExport(quiz) }}
                        className="p-1.5 rounded-md transition-colors" title="Xuất .qfz"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-app)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <Download className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(quiz.id) }}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Xóa"
                        style={{ color: 'var(--text-tertiary)' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

// ─── MonitorTab ───

function MonitorTab() {
    const { isMonitorActive, toggleMonitor, students, stats, serverInfo } = useMonitor()

    const statItems = [
        { label: 'Tổng học sinh', value: stats.total, icon: Users },
        { label: 'Đã nộp bài', value: stats.submitted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Đang làm bài', value: stats.working, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Cảnh báo TAB', value: stats.tabout, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    ]

    return (
        <div className="max-w-[1200px] mx-auto p-6">
            {/* Monitor controls */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            isMonitorActive ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : ""
                        )} style={!isMonitorActive ? { background: 'var(--text-disabled)' } : {}} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {isMonitorActive ? 'Đang lắng nghe' : 'Đã dừng'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full text-xs"
                        style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <span>IP: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{serverInfo.ip}</strong></span>
                        <span style={{ color: 'var(--text-disabled)' }}>&middot;</span>
                        <span>Port: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{serverInfo.port}</strong></span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            const selected = await open({
                                multiple: false,
                                filters: [{ name: 'Quiz Result', extensions: ['qfr'] }]
                            })
                            if (selected && typeof selected === 'string') {
                                try {
                                    await invoke('import_result_from_qfr', { path: selected })
                                    // Normally we should refresh, but useMonitor uses events and local state
                                    // For now, simple alert or let the user know it's imported
                                    // A full refresh of students list isn't easily triggered from here without more changes
                                    // But since it's now in DB, it will show up in Result management (if implemented)
                                } catch (e) {
                                    console.error('Import failed:', e)
                                }
                            }
                        }}
                        className="ui-toolbar-btn"
                    >
                        <Download className="w-3.5 h-3.5" /> Nhập kết quả (.qfr)
                    </button>
                    <button className="ui-toolbar-btn">
                        <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                    </button>
                    <button
                        onClick={toggleMonitor}
                        className={cn(
                            "inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg transition-all active:scale-[0.98]",
                            isMonitorActive
                                ? "text-red-600 border border-red-200 hover:bg-red-50"
                                : "text-white"
                        )}
                        style={!isMonitorActive ? { background: 'var(--accent)', borderRadius: 'var(--r-md)' } : { borderRadius: 'var(--r-md)' }}
                    >
                        {isMonitorActive ? 'Dừng giám sát' : 'Bắt đầu giám sát'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {statItems.map((s, i) => (
                    <div key={i} className="ui-card p-5 flex items-center gap-4">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", s.bg ?? 'bg-gray-50')}>
                            <s.icon className={cn("w-5 h-5", s.color ?? 'text-gray-500')} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold leading-none mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                            <div className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="ui-card overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            {['STT', 'Họ tên', 'Lớp', 'IP', 'Tiến độ', 'Điểm', 'Trạng thái'].map((h) => (
                                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                    style={{ color: 'var(--text-disabled)' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Radio className="w-8 h-8" style={{ color: 'var(--text-disabled)' }} />
                                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Chưa có dữ liệu kết nối</p>
                                        <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>Học sinh cần mở Player và bắt đầu làm bài.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : students.map((student: StudentMonitorData, index: number) => (
                            <tr
                                key={student.id}
                                className={cn(
                                    "transition-colors",
                                    student.status === 'tabout' && "bg-amber-50/50",
                                    student.status === 'submitted' && "bg-emerald-50/50",
                                )}
                                style={{ borderBottom: '1px solid var(--border)' }}
                            >
                                <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--text-disabled)' }}>
                                    {(index + 1).toString().padStart(2, '0')}
                                </td>
                                <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{student.name}</td>
                                <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{student.className}</td>
                                <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{student.ip}</td>
                                <td className="px-5 py-3 min-w-[130px]">
                                    <div className="ui-progress-track mb-1">
                                        <div
                                            className="ui-progress-fill"
                                            style={{
                                                width: `${student.progress}%`,
                                                background: student.status === 'submitted' ? '#10B981' : 'var(--accent)',
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{student.progress}%</span>
                                </td>
                                <td className="px-5 py-3 text-center font-semibold" style={{
                                    color: student.status === 'submitted' ? '#059669' : 'var(--text-disabled)'
                                }}>
                                    {student.score !== null ? student.score : '—'}
                                </td>
                                <td className="px-5 py-3">
                                    {student.status === 'working' && <span className="ui-badge status-working">Đang làm</span>}
                                    {student.status === 'tabout' && <span className="ui-badge status-tabout">Tab ra</span>}
                                    {student.status === 'submitted' && <span className="ui-badge status-submitted">Đã nộp</span>}
                                    {student.status === 'disconnected' && <span className="ui-badge status-lost">Mất KT</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Dashboard ───

export function Dashboard() {
    const navigate = useNavigate()
    const { dashboardTab, setDashboardTab, quizViewMode, setQuizViewMode, searchQuery, setSearchQuery } = useAppStore()
    const { data: quizzes = [], isLoading } = useQuizzes()
    const createQuiz = useCreateQuiz()
    const deleteQuiz = useDeleteQuiz()
    const duplicateQuiz = useDuplicateQuiz()
    const importQuiz = useImportQuizFile()
    const exportQuiz = useExportQuizFile()
    const [actionError, setActionError] = useState<string | null>(null)
    const [showImportExcel, setShowImportExcel] = useState(false)

    const handleCreate = async () => {
        setActionError(null)
        try {
            const quiz = await createQuiz.mutateAsync({ title: 'Untitled Quiz' })
            navigate({ to: '/quiz/$quizId', params: { quizId: quiz.id } })
        } catch (err) { setActionError(String(err)) }
    }

    const handleImport = async () => {
        const selected = await open({ multiple: false, filters: [{ name: 'QuizForge File', extensions: ['qfz'] }] })
        if (selected && typeof selected === 'string') await importQuiz.mutateAsync(selected)
    }

    const handleExport = async (quizId: string, title: string) => {
        const exportPath = await save({ defaultPath: `${title}.qfz`, filters: [{ name: 'QuizForge File', extensions: ['qfz'] }] })
        if (exportPath) await exportQuiz.mutateAsync({ quizId, exportPath })
    }

    const filteredQuizzes = quizzes.filter(q =>
        !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-app)' }}>
            {/* Header */}
            <div className="ui-header">
                <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-app)]" title="Quay lại"
                    style={{ color: 'var(--text-tertiary)' }}>
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                    <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>QuizForge</span>
                <div className="flex-1" />
                <Link to="/settings" className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-app)]" title="Thiết lập"
                    style={{ color: 'var(--text-tertiary)' }}>
                    <Settings className="w-4 h-4" />
                </Link>
            </div>

            {/* Error */}
            {actionError && (
                <div className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 text-sm flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{actionError}</span>
                    <button onClick={() => setActionError(null)} className="text-red-300 hover:text-red-500">&times;</button>
                </div>
            )}

            {/* Tabs */}
            <div className="ui-pivot flex-shrink-0">
                <button onClick={() => setDashboardTab('quizzes')} className={cn('ui-pivot-item', dashboardTab === 'quizzes' && 'active')}>
                    <FileText className="w-4 h-4" /> Quản lý Quiz
                </button>
                <button onClick={() => setDashboardTab('monitor')} className={cn('ui-pivot-item', dashboardTab === 'monitor' && 'active')}>
                    <Radio className="w-4 h-4" /> Giám sát lớp học
                </button>
            </div>

            {/* Content */}
            <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-app)' }}>
                {dashboardTab === 'quizzes' ? (
                    <div className="max-w-[1200px] mx-auto p-6">
                        {/* Toolbar */}
                        <div className="flex items-center gap-2.5 mb-6">
                            <button
                                onClick={handleCreate}
                                disabled={createQuiz.isPending}
                                className="inline-flex items-center gap-1.5 h-9 px-4 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-all active:scale-[0.98] hover:brightness-110 shadow-sm"
                                style={{ background: 'var(--accent)' }}
                            >
                                <Plus className="w-4 h-4" />
                                {createQuiz.isPending ? 'Đang tạo...' : 'Tạo Quiz'}
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importQuiz.isPending}
                                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-xl disabled:opacity-50 transition-all hover:bg-[var(--bg-layer)]"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-xs)' }}
                            >
                                <FolderOpen className="w-4 h-4" />
                                {importQuiz.isPending ? 'Đang nạp...' : 'Mở .qfz'}
                            </button>
                            <button
                                onClick={() => setShowImportExcel(true)}
                                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-xl transition-all hover:bg-[var(--bg-layer)]"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-xs)' }}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Import Excel
                            </button>

                            <div className="flex-1" />

                            {/* Search */}
                            <div className="ui-search">
                                <Search className="ui-search-icon w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* View toggle */}
                            <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-xs)' }}>
                                <button
                                    onClick={() => setQuizViewMode('grid')}
                                    className="h-9 w-9 flex items-center justify-center transition-all"
                                    style={quizViewMode === 'grid'
                                        ? { background: 'var(--accent)', color: 'white' }
                                        : { color: 'var(--text-tertiary)' }}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setQuizViewMode('list')}
                                    className="h-9 w-9 flex items-center justify-center transition-all"
                                    style={quizViewMode === 'list'
                                        ? { background: 'var(--accent)', color: 'white' }
                                        : { color: 'var(--text-tertiary)' }}
                                >
                                    <List className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Section label */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {searchQuery ? `Kết quả cho "${searchQuery}"` : 'Tất cả Quiz'}
                            </h2>
                            {!isLoading && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-card)', color: 'var(--text-tertiary)', boxShadow: 'var(--shadow-xs)' }}>
                                    {filteredQuizzes.length} quiz
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--text-disabled)' }} />
                            </div>
                        ) : filteredQuizzes.length === 0 ? (
                            <div className="py-20 flex flex-col items-center gap-4 rounded-2xl" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                                    <FileText className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                                </div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    {searchQuery ? 'Không tìm thấy quiz phù hợp.' : 'Chưa có Quiz nào'}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={handleCreate}
                                        className="text-xs font-medium px-4 py-2 rounded-lg text-white transition-all active:scale-[0.98]"
                                        style={{ background: 'var(--accent)' }}
                                    >
                                        + Tạo Quiz đầu tiên
                                    </button>
                                )}
                            </div>
                        ) : quizViewMode === 'grid' ? (
                            <div className="flex flex-wrap gap-4">
                                {filteredQuizzes.map((quiz) => (
                                    <QuizCard
                                        key={quiz.id}
                                        quiz={quiz}
                                        onDuplicate={(id) => duplicateQuiz.mutate(id)}
                                        onDelete={(id) => deleteQuiz.mutate(id)}
                                        onExport={(q) => handleExport(q.id, q.title)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="ui-card overflow-hidden">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                            {['Tên Quiz', 'Câu hỏi', 'Ngày tạo', 'Ngày sửa', 'Thao tác'].map((h, i) => (
                                                <th key={h}
                                                    className={cn("px-5 py-3 text-[10px] font-semibold uppercase tracking-wider",
                                                        i === 1 ? "text-center" : i === 4 ? "text-center" : "text-left")}
                                                    style={{ color: 'var(--text-disabled)' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredQuizzes.map((quiz) => (
                                            <QuizListRow
                                                key={quiz.id}
                                                quiz={quiz}
                                                onDuplicate={(id) => duplicateQuiz.mutate(id)}
                                                onDelete={(id) => deleteQuiz.mutate(id)}
                                                onExport={(q) => handleExport(q.id, q.title)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <MonitorTab />
                )}
            </main>

            {/* Status bar */}
            <div className="ui-status-bar">
                <div className="ui-status-bar-section">Quizzes: {quizzes.length}</div>
                <div className="ui-status-bar-section">v{APP_VERSION}</div>
            </div>

            <ImportExcelDialog
                open={showImportExcel}
                onClose={() => setShowImportExcel(false)}
                onSuccess={(quizId) => navigate({ to: '/quiz/$quizId', params: { quizId } })}
            />
        </div>
    )
}
