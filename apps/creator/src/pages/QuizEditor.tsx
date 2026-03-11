import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    Settings,
    MonitorPlay,
    Share,
    BarChart2,
    Plus,
    CheckSquare,
    CircleDot,
    TextCursor,
    ArrowLeftRight,
    ListOrdered,
    BookOpen,
    MousePointer,
    FileText,
    File as FileIcon,
    Play,
    Users,
    ShieldCheck,
    ChevronRight,
    GripVertical,
    Trash2,
    Copy,
    Folder,
    ChevronDown,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useQuiz, useUpdateQuiz, quizKeys } from '../hooks/useQuizzes'
import { useAddQuestion, useUpdateQuestion, useDeleteQuestion, useDuplicateQuestion } from '../hooks/useQuestions'
import { type Question, type QuestionType, type Quiz, type QuizUser, type Theme, type Student } from '@quizforge/types'
import { QuestionEditorDialog } from '../components/QuestionEditorDialog'
import { QuizPropertiesDialog } from '../components/QuizPropertiesDialog'
import { ThemeEditorDialog } from '../components/ThemeEditorDialog'
import { StudentListDialog } from '../components/StudentListDialog'
import { BrandingDialog } from '../components/BrandingDialog'
import { ExportDialog } from '../components/ExportDialog'
import { ImportWordDialog } from '../components/ImportWordDialog'
import { useMutation, useQueryClient, useIsMutating } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Loader2, CheckCircle2 } from 'lucide-react'

// ─── Type Config ───

type TypeConfigEntry = { icon: LucideIcon; label: string; color: string }
const typeConfig: Record<string, TypeConfigEntry> = {
    true_false: { icon: CheckSquare, label: 'True/False', color: '#7c3aed' },
    multiple_choice: { icon: CircleDot, label: 'Multiple Choice', color: '#2563eb' },
    multiple_response: { icon: CheckSquare, label: 'Multiple Response', color: '#0891b2' },
    fill_in_blank: { icon: TextCursor, label: 'Fill in the Blank', color: '#059669' },
    matching: { icon: ArrowLeftRight, label: 'Matching', color: '#d97706' },
    sequence: { icon: ListOrdered, label: 'Sequence', color: '#dc2626' },
    word_bank: { icon: BookOpen, label: 'Word Bank', color: '#7c3aed' },
    click_map: { icon: MousePointer, label: 'Click Map', color: '#0891b2' },
    short_essay: { icon: FileText, label: 'Short Essay', color: '#059669' },
    blank_page: { icon: FileIcon, label: 'Blank Page', color: '#64748b' },
}

const QUESTION_TYPES: QuestionType[] = [
    'true_false', 'multiple_choice', 'multiple_response', 'fill_in_blank',
    'matching', 'sequence', 'word_bank', 'click_map', 'short_essay', 'blank_page'
]

// ─── Default Question Factory ───

function createDefaultQuestion(type: QuestionType, order: number): Question {
    const base = {
        id: crypto.randomUUID(),
        text: '',
        points: { correct: 10, incorrect: 0 },
        feedback: { correct: 'Chính xác!', incorrect: 'Chưa đúng rồi.' },
        feedbackMode: 'by_question' as const,
        attempts: 1,
        order,
        timeLimit: 0,
        autoNext: false,
    }
    switch (type) {
        case 'true_false':
            return { ...base, type: 'true_false', correctAnswer: 'true' }
        case 'multiple_choice':
            return {
                ...base, type: 'multiple_choice', options: [
                    { id: crypto.randomUUID(), text: 'Lựa chọn 1', isCorrect: true },
                    { id: crypto.randomUUID(), text: 'Lựa chọn 2', isCorrect: false },
                ], shuffleOptions: false
            }
        case 'multiple_response':
            return {
                ...base, type: 'multiple_response', options: [
                    { id: crypto.randomUUID(), text: 'Lựa chọn 1', isCorrect: true },
                    { id: crypto.randomUUID(), text: 'Lựa chọn 2', isCorrect: false },
                ], shuffleOptions: false, partialScoring: false
            }
        case 'fill_in_blank': {
            const blankId = crypto.randomUUID()
            return {
                ...base, type: 'fill_in_blank',
                templateText: `Điền vào chỗ trống: {{${blankId}}}`,
                blanks: [{ id: blankId, position: 0, acceptableAnswers: [''], caseSensitive: false, trimWhitespace: true }]
            }
        }
        case 'matching':
            return {
                ...base, type: 'matching', pairs: [
                    { id: crypto.randomUUID(), choice: '', match: '' },
                    { id: crypto.randomUUID(), choice: '', match: '' },
                ], shuffleChoices: true, shuffleMatches: true, displayMode: 'dragdrop'
            }
        case 'sequence':
            return {
                ...base, type: 'sequence', items: [
                    { id: crypto.randomUUID(), text: 'Bước 1', correctOrder: 0 },
                    { id: crypto.randomUUID(), text: 'Bước 2', correctOrder: 1 },
                    { id: crypto.randomUUID(), text: 'Bước 3', correctOrder: 2 },
                ], partialScoring: false
            }
        case 'word_bank': {
            const slotId = crypto.randomUUID()
            const wordId = crypto.randomUUID()
            return {
                ...base, type: 'word_bank',
                templateText: `Điền từ: {{${slotId}}}`,
                slots: [{ id: slotId, position: 0, correctWordId: wordId }],
                words: [{ id: wordId, text: 'từ mẫu', isDistractor: false }],
                shuffleWords: true
            }
        }
        case 'click_map':
            return {
                ...base, type: 'click_map',
                mapImage: { id: crypto.randomUUID(), type: 'image', filename: '', mimeType: 'image/png', data: '' },
                hotspots: [], allowMultipleClicks: false
            }
        case 'short_essay':
            return { ...base, type: 'short_essay', referenceAnswer: '', keywordMatching: [] }
        case 'blank_page':
            return { ...base, type: 'blank_page', title: 'Thông tin', content: '', showTimer: true }
    }
}

// ─── Command Bar Button (compact, horizontal) ───

function CmdBtn({ icon: Icon, label, onClick, active, color }: {
    icon: LucideIcon; label: string; onClick?: () => void;
    active?: boolean; color?: string
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all select-none",
                active
                    ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
                    : "hover:bg-[var(--bg-app)] active:bg-[var(--bg-layer)]"
            )}
            style={{ color: color ?? 'var(--text-secondary)' }}
        >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline">{label}</span>
        </button>
    )
}

// ─── Question Row ───

function SortableQuestionRow({
    q, index, selected, onClick, onContextMenu,
}: { q: Question; index: number; selected: boolean; onClick: () => void; onContextMenu?: (e: React.MouseEvent) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id })
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }
    const cfg = typeConfig[q.type]

    const rowStyle = {
        ...style,
        background: isDragging ? 'var(--bg-card)' : selected ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
    }

    return (
        <tr
            ref={setNodeRef} style={rowStyle} onClick={onClick} onContextMenu={onContextMenu}
            className={cn(
                'cursor-pointer group transition-colors border-b border-[var(--border)]',
                isDragging && 'opacity-50 shadow-lg',
                selected && 'border-l-2 border-l-[var(--accent)]'
            )}
            onMouseEnter={e => { if (!selected && !isDragging) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-alt)' }}
            onMouseLeave={e => { if (!selected && !isDragging) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
            {/* ID */}
            <td className="px-2 py-2 text-xs text-center w-10" style={{ color: 'var(--text-tertiary)' }}>
                <div className="flex items-center justify-center gap-1">
                    <span {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3" style={{ color: 'var(--text-disabled)' }} />
                    </span>
                    <span className="font-mono text-[11px]">{index + 1}</span>
                </div>
            </td>
            {/* Type */}
            <td className="px-3 py-2 text-xs w-36">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ background: `${cfg?.color}12`, color: cfg?.color }}>
                    {cfg && <cfg.icon className="w-3 h-3 shrink-0" />}
                    {cfg?.label ?? q.type}
                </span>
            </td>
            {/* Question */}
            <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                <span className="line-clamp-1">
                    {q.text || <span className="italic" style={{ color: 'var(--text-disabled)' }}>Chưa có nội dung</span>}
                </span>
            </td>
            {/* Feedback */}
            <td className="px-3 py-2 text-xs w-16 text-center" style={{ color: 'var(--text-tertiary)' }}>
                {q.feedback?.correct ? <span className="text-emerald-500">✓</span> : '—'}
            </td>
            {/* Group */}
            <td className="px-3 py-2 text-xs w-20 text-center" style={{ color: 'var(--text-tertiary)' }}>
                {(q as Question & { group?: string }).group
                    ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}>{(q as Question & { group?: string }).group}</span>
                    : '—'}
            </td>
            {/* Points */}
            <td className="px-3 py-2 text-xs font-semibold w-16 text-center" style={{ color: 'var(--text-primary)' }}>
                {q.type === 'blank_page' ? '—' : q.points?.correct ?? 0}
            </td>
            {/* Media */}
            <td className="px-3 py-2 text-xs w-14 text-center" style={{ color: 'var(--text-disabled)' }}>
                {(q as Question & { media?: unknown }).media ? <span className="text-blue-500">📎</span> : '—'}
            </td>
        </tr>
    )
}

// ─── Main Editor ───

export function QuizEditor() {
    const { quizId } = useParams({ strict: false }) as { quizId: string }
    const navigate = useNavigate()
    const { data: quiz, isLoading, error } = useQuiz(quizId)
    const qc = useQueryClient()
    const mutatingCount = useIsMutating()
    const isSaving = mutatingCount > 0
    const hasUnsavedChanges = useAppStore(s => s.hasUnsavedChanges)
    const setHasUnsavedChanges = useAppStore(s => s.setHasUnsavedChanges)

    const [selectedIdx, setSelectedIdx] = useState(-1)
    const [sortMode, setSortMode] = useState<'order' | 'type' | 'group'>('order')
    const [treeExpanded, setTreeExpanded] = useState(true)
    const [groupsExpanded, setGroupsExpanded] = useState(true)
    const [typesExpanded, setTypesExpanded] = useState(true)
    const [showTypeMenu, setShowTypeMenu] = useState(false)
    const typeMenuRef = useRef<HTMLDivElement>(null)

    // Dialog state
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
    const [isThemeOpen, setIsThemeOpen] = useState(false)
    const [isStudentListOpen, setIsStudentListOpen] = useState(false)
    const [isBrandingOpen, setIsBrandingOpen] = useState(false)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const [isImportWordOpen, setIsImportWordOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
    const [editingIndex, setEditingIndex] = useState(-1)
    const [isEditingExisting, setIsEditingExisting] = useState(false)

    const addQuestionMutation = useAddQuestion()
    const updateQuestionMutation = useUpdateQuestion()
    const deleteQuestionMutation = useDeleteQuestion()
    const duplicateQuestionMutation = useDuplicateQuestion()
    const updateQuizMutation = useUpdateQuiz(quizId)

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; question: Question; index: number } | null>(null)
    const [showGroupSubmenu, setShowGroupSubmenu] = useState(false)

    const reorderMutation = useMutation({
        mutationFn: async (order: string[]) => { await invoke('reorder_questions', { quizId, order }) },
        onSuccess: () => { qc.invalidateQueries({ queryKey: quizKeys.detail(quizId) }); setHasUnsavedChanges(true) }
    })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // Close type menu / context menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
                setShowTypeMenu(false)
            }
            if (contextMenu) {
                // simple outside click detection for context menu:
                setContextMenu(null)
                setShowGroupSubmenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [contextMenu])

    // Prevent closing if editing or saving
    useEffect(() => {
        let unlistenFn: (() => void) | undefined

        const setupCloseListener = async () => {
            unlistenFn = await getCurrentWindow().onCloseRequested(async (event) => {
                if (isSaving || isEditorOpen || hasUnsavedChanges) {
                    event.preventDefault()
                    const { ask } = await import('@tauri-apps/plugin-dialog')
                    const confirmed = await ask('Bạn đang chỉnh sửa câu hỏi hoặc hệ thống đang lưu. Bạn có chắc chắn muốn thoát?', {
                        title: 'Xác nhận thoát',
                        kind: 'warning'
                    })
                    if (confirmed) {
                        await getCurrentWindow().destroy()
                    }
                }
            })
        }

        setupCloseListener()

        return () => {
            if (unlistenFn) unlistenFn()
        }
    }, [isSaving, isEditorOpen])

    if (isLoading) return (
        <div className="h-screen flex items-center justify-center text-sm" style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)', fontFamily: 'var(--ui-font)' }}>
            Đang tải Quiz...
        </div>
    )
    if (error || !quiz) return (
        <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)', fontFamily: 'var(--ui-font)' }}>
            <div className="p-6 text-center" style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                <p className="text-red-500 mb-2 text-sm">Lỗi tải dữ liệu</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>{error?.message || 'Không tìm thấy Quiz.'}</p>
                <Link to="/" className="text-sm" style={{ color: 'var(--accent)' }}>← Quay lại Dashboard</Link>
            </div>
        </div>
    )

    const quizTitle = quiz.information?.title ?? 'New Quiz'
    const questions = quiz.questions ?? []

    // Sorted display
    const displayedQuestions = sortMode === 'type'
        ? [...questions].sort((a, b) => a.type.localeCompare(b.type))
        : sortMode === 'group'
            ? [...questions].sort((a, b) => (a.group || '').localeCompare(b.group || ''))
            : questions

    const scoreTotal = questions
        .filter((q: Question) => q.type !== 'blank_page')
        .reduce((acc: number, q: Question) => acc + (q.points?.correct ?? 0), 0)

    // Extract unique groups from questions
    const groups = Array.from(new Set(questions.map((q: Question) => q.group).filter(Boolean))) as string[]

    // Handlers
    const handleAddQuestion = (type: QuestionType = 'multiple_choice') => {
        setShowTypeMenu(false)
        setEditingQuestion(createDefaultQuestion(type, questions.length))
        setEditingIndex(-1)
        setIsEditingExisting(false)
        setIsEditorOpen(true)
    }

    const handleEditQuestion = (q: Question, index: number) => {
        setEditingQuestion(q)
        setEditingIndex(index)
        setIsEditingExisting(true)
        setSelectedIdx(index)
        setIsEditorOpen(true)
    }

    const handleSaveQuestion = (q: Question) => {
        if (isEditingExisting) {
            updateQuestionMutation.mutate({ quizId, question: q })
        } else {
            addQuestionMutation.mutate({ quizId, question: q })
        }
        setHasUnsavedChanges(true)
        setIsEditorOpen(false)
    }

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (!questions.length) return
        const newIndex = direction === 'prev'
            ? Math.max(0, editingIndex - 1)
            : Math.min(questions.length - 1, editingIndex + 1)
        if (newIndex !== editingIndex) {
            setEditingQuestion(questions[newIndex])
            setEditingIndex(newIndex)
        }
    }

    const handleDeleteQuestion = async (q: Question) => {
        const { ask } = await import('@tauri-apps/plugin-dialog')
        const yes = await ask('Bạn có chắc muốn xóa câu hỏi này?', { title: 'Xác nhận xóa', kind: 'warning' })
        if (yes) {
            deleteQuestionMutation.mutate({ quizId, questionId: q.id })
            setHasUnsavedChanges(true)
            setSelectedIdx(-1)
            setContextMenu(null)
        }
    }

    const handleDuplicateQuestion = (q: Question) => {
        duplicateQuestionMutation.mutate({ quizId, questionId: q.id })
        setContextMenu(null)
    }

    const handleNewQuestionFromDialog = () => {
        // Save current question first, then open new
        if (editingQuestion) {
            const errors = editingQuestion.text.trim() || editingQuestion.type === 'blank_page' ? [] : ['empty']
            if (errors.length === 0 || editingQuestion.type === 'blank_page') {
                handleSaveQuestion(editingQuestion)
            }
        }
        setEditingQuestion(createDefaultQuestion('multiple_choice', questions.length))
        setEditingIndex(-1)
        setIsEditingExisting(false)
        setIsEditorOpen(true)
    }

    const handleContextMenu = (e: React.MouseEvent, q: Question, index: number) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY, question: q, index })
        setSelectedIdx(index)
        setShowGroupSubmenu(false)
    }

    const handleMoveToGroup = (q: Question, newGroup: string | undefined) => {
        updateQuestionMutation.mutate({ quizId, question: { ...q, group: newGroup } })
        setContextMenu(null)
        setShowGroupSubmenu(false)
    }

    const handleNewGroup = (q: Question) => {
        const name = prompt('Nhập tên nhóm mới:')
        if (name && name.trim()) {
            handleMoveToGroup(q, name.trim())
        } else {
            setContextMenu(null)
            setShowGroupSubmenu(false)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const oldIdx = questions.findIndex((q: Question) => q.id === active.id)
            const newIdx = questions.findIndex((q: Question) => q.id === over?.id)
            const newOrder = arrayMove(questions, oldIdx, newIdx)
            reorderMutation.mutate(newOrder.map((q: Question) => q.id))
        }
    }

    const handleUpdateQuiz = (updatedQuiz: Quiz) => updateQuizMutation.mutate(updatedQuiz)
    const handleSaveTheme = (theme: Theme) => updateQuizMutation.mutate({ ...quiz, theme })
    const handleSaveStudents = (students: Student[]) => {
        const users: QuizUser[] = students.map(s => ({ id: s.id, name: s.name, password: s.id.slice(0, 6) }))
        updateQuizMutation.mutate({ ...quiz, security: { ...quiz.security, users } })
        setIsStudentListOpen(false)
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-app)', fontFamily: 'var(--ui-font)', fontSize: 13 }}>

            {/* ── Command Bar ── */}
            <div className="flex-shrink-0 h-11 px-3 flex items-center gap-1" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>

                {/* Back + Title */}
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all hover:bg-[var(--bg-app)]"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <ArrowLeftRight className="w-4 h-4 rotate-180" style={{ color: 'var(--text-tertiary)' }} />
                </Link>

                <span className="text-sm font-semibold truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }} title={quizTitle}>
                    {quizTitle}
                </span>

                <div className="flex items-center ml-1">
                    {isSaving ? (
                        <span className="text-[11px] text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium select-none" style={{ background: 'rgba(245,158,11,0.08)' }}>
                            <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
                        </span>
                    ) : (
                        <span className="text-[11px] px-2 py-0.5 flex items-center gap-1 select-none" style={{ color: 'var(--text-disabled)' }}>
                            <CheckCircle2 className="w-3 h-3" /> Đã lưu
                        </span>
                    )}
                </div>

                <div className="w-px h-5 mx-1.5" style={{ background: 'var(--border)' }} />

                {/* New Question with dropdown */}
                <div className="relative" ref={typeMenuRef}>
                    <button
                        onClick={() => setShowTypeMenu(v => !v)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white transition-all active:scale-[0.98]"
                        style={{ background: 'var(--accent)' }}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm câu hỏi</span>
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
                    </button>

                    {showTypeMenu && (
                        <div className="absolute left-0 top-full mt-1 z-50 py-1.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', width: 220 }}>
                            {QUESTION_TYPES.map(type => {
                                const cfg = typeConfig[type]
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleAddQuestion(type)}
                                        className="w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-app)] rounded-md mx-0"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${cfg.color}14` }}>
                                            <cfg.icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                                        </div>
                                        {cfg.label}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="w-px h-5 mx-1.5" style={{ background: 'var(--border)' }} />

                <CmdBtn icon={Settings} label="Cài đặt" onClick={() => setIsPropertiesOpen(true)} />
                <CmdBtn icon={FileText} label="Import Word" onClick={() => setIsImportWordOpen(true)} />
                <CmdBtn icon={MonitorPlay} label="Giao diện" onClick={() => setIsThemeOpen(true)} />

                <div className="w-px h-5 mx-1.5" style={{ background: 'var(--border)' }} />

                <CmdBtn icon={Play} label="Xem trước" onClick={() => navigate({ to: '/preview/$quizId', params: { quizId } })} />
                <CmdBtn icon={Share} label="Xuất bản" onClick={() => setIsExportOpen(true)} color="var(--accent)" />

                <div className="flex-1" />

                <CmdBtn icon={Users} label="Học sinh" onClick={() => setIsStudentListOpen(true)} />
                <CmdBtn icon={ShieldCheck} label="Branding" onClick={() => setIsBrandingOpen(true)} />
                <CmdBtn icon={BarChart2} label="Kết quả" onClick={() => navigate({ to: '/dashboard', search: { tab: 'monitor' } })} />
            </div>

            {/* ── Main Area ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Tree Panel */}
                <div className="w-48 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

                    {/* Sort dropdown */}
                    <div className="px-2.5 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <select
                            value={sortMode}
                            onChange={e => setSortMode(e.target.value as 'order' | 'type' | 'group')}
                            className="w-full text-[11px] h-7 px-2 outline-none rounded-lg"
                            style={{ border: '1px solid var(--border-control)', background: 'var(--bg-app)', color: 'var(--text-secondary)' }}
                        >
                            <option value="order">Theo thứ tự</option>
                            <option value="type">Theo loại</option>
                            <option value="group">Theo nhóm</option>
                        </select>
                    </div>

                    {/* Tree */}
                    <div className="flex-1 overflow-y-auto py-1">
                        {/* Root node */}
                        <button
                            onClick={() => setTreeExpanded(v => !v)}
                            className="w-full flex items-center gap-1 px-2 py-1 text-[11px] transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {treeExpanded
                                ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                            }
                            <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                            <span className="truncate font-medium">{quizTitle}</span>
                        </button>

                        {/* Groups Node */}
                        {treeExpanded && (
                            <>
                                <button
                                    onClick={() => setGroupsExpanded(v => !v)}
                                    className="w-full flex items-center gap-1 px-2 py-1 pl-4 text-[11px] transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {groupsExpanded
                                        ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                        : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                    }
                                    <Folder className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                                    <span className="truncate font-medium flex-1 text-left">Groups</span>
                                </button>

                                {groupsExpanded && groups.map(group => {
                                    const count = questions.filter((q: Question) => q.group === group).length
                                    return (
                                        <button
                                            key={`group-${group}`}
                                            className="w-full flex items-center gap-1.5 pl-9 pr-2 py-0.5 text-[11px] group transition-colors"
                                            style={{ color: 'var(--text-secondary)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <Folder className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                            <span className="flex-1 text-left truncate">{group}</span>
                                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>({count})</span>
                                        </button>
                                    )
                                })}

                                {/* Types Node */}
                                <button
                                    onClick={() => setTypesExpanded(v => !v)}
                                    className="w-full flex items-center gap-1 px-2 py-1 pl-4 text-[11px] transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {typesExpanded
                                        ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                        : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                    }
                                    <ListOrdered className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                                    <span className="truncate font-medium flex-1 text-left">Types</span>
                                </button>

                                {/* Question type nodes */}
                                {typesExpanded && QUESTION_TYPES.map(type => {
                                    const cfg = typeConfig[type]
                                    const count = questions.filter((q: Question) => q.type === type).length
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handleAddQuestion(type as QuestionType)}
                                            className="w-full flex items-center gap-1.5 pl-9 pr-2 py-0.5 text-[11px] group transition-colors"
                                            style={{ color: 'var(--text-secondary)' }}
                                            title={`Thêm câu hỏi ${cfg.label}`}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <cfg.icon className="w-3 h-3 shrink-0" style={{ color: cfg.color }} />
                                            <span className="flex-1 text-left truncate">{cfg.label}</span>
                                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>({count})</span>
                                        </button>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* Content Table */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full border-collapse text-[12px]" style={{ minWidth: 600 }}>
                            <thead>
                                <tr className="sticky top-0 z-10" style={{ background: 'var(--bg-card-alt)', borderBottom: '2px solid var(--border)' }}>
                                    <th className="px-2 py-2.5 text-center font-medium w-10 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>#</th>
                                    <th className="px-3 py-2.5 text-left font-medium w-36 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Loại</th>
                                    <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Câu hỏi</th>
                                    <th className="px-3 py-2.5 text-center font-medium w-16 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>FB</th>
                                    <th className="px-3 py-2.5 text-center font-medium w-20 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Nhóm</th>
                                    <th className="px-3 py-2.5 text-center font-medium w-16 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Điểm</th>
                                    <th className="px-3 py-2.5 text-center font-medium w-14 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Media</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedQuestions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-16 text-center text-slate-400 text-xs">
                                            <div className="flex flex-col items-center gap-2">
                                                <Plus className="w-8 h-8 text-slate-200" />
                                                <p>Chưa có câu hỏi nào. Nhấp vào loại câu hỏi ở bên trái để thêm.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={displayedQuestions.map((q: Question) => q.id)} strategy={verticalListSortingStrategy}>
                                            {displayedQuestions.map((q: Question, i: number) => (
                                                <SortableQuestionRow
                                                    key={q.id}
                                                    q={q}
                                                    index={i}
                                                    selected={selectedIdx === i}
                                                    onClick={() => handleEditQuestion(q, i)}
                                                    onContextMenu={(e) => handleContextMenu(e, q, i)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Status Bar ── */}
            <div className="ui-status-bar">
                <div className="ui-status-bar-section gap-1">
                    <FileText className="w-3 h-3" style={{ color: 'var(--text-disabled)' }} />
                    <span>{questions.length} câu hỏi</span>
                </div>
                <div className="ui-status-bar-section">
                    Tổng điểm: <strong className="ml-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>{scoreTotal}</strong>
                </div>
                <div className="ui-status-bar-section">
                    Đạt: {quiz.settings?.passingRate ?? 95}%
                </div>
                {hasUnsavedChanges && (
                    <div className="ui-status-bar-section gap-1" style={{ color: 'var(--accent)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="font-medium">Đã sửa đổi</span>
                    </div>
                )}
            </div>

            {/* ── Context Menu ── */}
            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-[100]" onMouseDown={(e) => {
                        // Close menu only if clicking outside
                        if (!(e.target as Element).closest('.qf-context-menu')) {
                            setContextMenu(null);
                            setShowGroupSubmenu(false);
                        }
                    }} onContextMenu={(e) => { e.preventDefault() }} />
                    <div
                        className="qf-context-menu fixed z-[101] py-1 min-w-[160px] rounded shadow-lg border"
                        style={{ left: contextMenu.x, top: contextMenu.y, background: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { handleEditQuestion(contextMenu.question, contextMenu.index); setContextMenu(null) }}
                            className="w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <FileText className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} /> Chỉnh sửa
                        </button>
                        <button
                            onClick={() => handleDuplicateQuestion(contextMenu.question)}
                            className="w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} /> Nhân bản
                        </button>

                        <div className="my-1 border-t relative" style={{ borderColor: 'var(--border)' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowGroupSubmenu(!showGroupSubmenu)
                                }}
                                className="w-full px-3 py-1.5 text-left text-[12px] flex items-center justify-between gap-2 hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <Folder className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} /> Chuyển nhóm
                                </div>
                                <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                            </button>

                            {showGroupSubmenu && (
                                <div
                                    className="absolute left-[98%] top-0 py-1 min-w-[160px] rounded shadow-lg border z-[102]"
                                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}
                                >
                                    <button
                                        onClick={() => handleNewGroup(contextMenu.question)}
                                        className="w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        <Plus className="w-3 h-3" style={{ color: 'var(--accent)' }} /> Tạo nhóm mới...
                                    </button>

                                    {contextMenu.question.group && (
                                        <button
                                            onClick={() => handleMoveToGroup(contextMenu.question, undefined)}
                                            className="w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-red-50 text-red-600"
                                        >
                                            <Trash2 className="w-3 h-3" /> Gỡ khỏi nhóm
                                        </button>
                                    )}

                                    {groups.length > 0 && <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />}

                                    {groups.map(group => (
                                        <button
                                            key={group}
                                            onClick={() => handleMoveToGroup(contextMenu.question, group)}
                                            className="w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                                            style={{ color: 'var(--text-primary)' }}
                                            disabled={contextMenu.question.group === group}
                                        >
                                            <Folder className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} /> {group}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
                        <button
                            onClick={() => handleDeleteQuestion(contextMenu.question)}
                            className="w-full px-3 py-1.5 text-left text-[12px] flex items-center gap-2 hover:bg-red-50 text-red-600"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa câu hỏi
                        </button>
                    </div>
                </>
            )}

            {/* ── Dialogs ── */}
            <QuestionEditorDialog
                isOpen={isEditorOpen}
                question={editingQuestion}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveQuestion}
                questionIndex={editingIndex}
                totalQuestions={questions.length}
                onNavigate={handleNavigate}
                onNew={handleNewQuestionFromDialog}
            />
            <QuizPropertiesDialog
                quiz={quiz}
                isOpen={isPropertiesOpen}
                onClose={() => setIsPropertiesOpen(false)}
                onSave={handleUpdateQuiz}
            />
            <ThemeEditorDialog
                quiz={quiz}
                isOpen={isThemeOpen}
                onClose={() => setIsThemeOpen(false)}
                onSave={handleSaveTheme}
            />
            <StudentListDialog
                isOpen={isStudentListOpen}
                onClose={() => setIsStudentListOpen(false)}
                students={quiz.security?.users?.map((u: QuizUser) => ({
                    id: u.id, name: u.name, className: '', orderIndex: 0
                })) ?? []}
                onSave={handleSaveStudents}
            />
            <ExportDialog
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                quizTitle={quizTitle}
                quizData={quiz}
            />
            <ImportWordDialog isOpen={isImportWordOpen} onClose={() => setIsImportWordOpen(false)} quizId={quizId} />
            <BrandingDialog
                isOpen={isBrandingOpen}
                onClose={() => setIsBrandingOpen(false)}
                onSave={(branding) => {
                    updateQuizMutation.mutate({ ...quiz, information: { ...quiz.information, branding } })
                }}
            />
        </div>
    )
}
