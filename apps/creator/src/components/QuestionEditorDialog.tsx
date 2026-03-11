import { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
} from "./ui/dialog"
import {
    Scissors,
    Copy as CopyIcon,
    Clipboard as ClipboardPaste,
    Star,
    StickyNote,
    Sigma,
    Image as ImageIcon,
    Music,
    Video,
    SpellCheck,
    Eye,
    ChevronDown,
    AlertCircle,
    Trash2,
    Save,
    X,
    GitBranch,
    Clock,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react"
import { type Editor } from "@tiptap/react"
import { Question } from "@quizforge/types"
import { useParams } from "@tanstack/react-router"
import { useUploadMedia, useMediaData } from "../hooks/useMedia"
import { TrueFalseEditor } from "./editors/TrueFalseEditor"
import { MultipleChoiceEditor } from "./editors/MultipleChoiceEditor"
import { MultipleResponseEditor } from "./editors/MultipleResponseEditor"
import { FillInBlankEditor } from "./editors/FillInBlankEditor"
import { MatchingEditor } from "./editors/MatchingEditor"
import { SequenceEditor } from "./editors/SequenceEditor"
import { WordBankEditor } from "./editors/WordBankEditor"
import { ClickMapEditor } from "./editors/ClickMapEditor"
import { ShortEssayEditor } from "./editors/ShortEssayEditor"
import { BlankPageEditor } from "./editors/BlankPageEditor"
import { RichTextEditor } from "./RichTextEditor"
import { cn } from "../lib/utils"

const QUESTION_TYPE_LABELS: Record<string, string> = {
    true_false: 'Đúng / Sai',
    multiple_choice: 'Nhiều lựa chọn',
    multiple_response: 'Nhiều đáp án đúng',
    fill_in_blank: 'Điền vào chỗ trống',
    matching: 'Ghép đôi',
    sequence: 'Sắp xếp thứ tự',
    word_bank: 'Ngân hàng từ',
    click_map: 'Bản đồ tương tác',
    short_essay: 'Trả lời ngắn',
    blank_page: 'Trang trống',
}

const EDITOR_SECTION_LABELS: Record<string, string> = {
    true_false: 'Câu trả lời',
    multiple_choice: 'Nhập các lựa chọn',
    multiple_response: 'Nhập các lựa chọn',
    fill_in_blank: 'Thiết lập chỗ trống',
    matching: 'Các cặp ghép đôi',
    sequence: 'Các mục sắp xếp',
    word_bank: 'Ngân hàng từ',
    click_map: 'Vùng tương tác',
    short_essay: 'Từ khóa đánh giá',
    blank_page: 'Nội dung trang',
}

/* ── Toolbar separator ─────────────────────── */

function ToolbarSep() {
    return <div className="w-px h-5 mx-1 shrink-0" style={{ background: 'var(--border)' }} />
}

/* ── Validation ─────────────────────────────── */

interface QuestionEditorDialogProps {
    question: Question | null
    isOpen: boolean
    onClose: () => void
    onSave: (question: Question) => void
    questionIndex?: number
    totalQuestions?: number
    onNavigate?: (direction: 'prev' | 'next') => void
    onNew?: () => void
}

function validateQuestion(q: Question): string[] {
    const errors: string[] = []
    if (q.type !== 'blank_page' && !q.text.trim()) {
        errors.push('Nội dung câu hỏi không được để trống.')
    }
    switch (q.type) {
        case 'multiple_choice':
            if (q.options.length < 2) errors.push('Cần ít nhất 2 lựa chọn.')
            if (!q.options.some(o => o.isCorrect)) errors.push('Phải chọn ít nhất 1 đáp án đúng.')
            break
        case 'multiple_response':
            if (q.options.length < 2) errors.push('Cần ít nhất 2 lựa chọn.')
            if (!q.options.some(o => o.isCorrect)) errors.push('Phải chọn ít nhất 1 đáp án đúng.')
            break
        case 'fill_in_blank':
            if (!q.templateText.trim()) errors.push('Nội dung mẫu không được để trống.')
            if (q.blanks.length < 1) errors.push('Cần ít nhất 1 chỗ trống.')
            break
        case 'matching':
            if (q.pairs.length < 2) errors.push('Cần ít nhất 2 cặp ghép.')
            if (q.pairs.some(p => !p.choice.trim() || !p.match.trim())) {
                errors.push('Tất cả các cặp ghép phải có nội dung.')
            }
            break
        case 'sequence':
            if (q.items.length < 2) errors.push('Cần ít nhất 2 mục sắp xếp.')
            if (q.items.some(i => !i.text.trim())) errors.push('Tất cả các mục phải có nội dung.')
            break
        case 'word_bank':
            if (!q.templateText.trim()) errors.push('Nội dung mẫu không được để trống.')
            if (q.slots.length < 1) errors.push('Cần ít nhất 1 vị trí điền từ.')
            if (q.words.length < 1) errors.push('Cần ít nhất 1 từ trong ngân hàng.')
            break
        case 'click_map':
            if (!q.mapImage.data) errors.push('Cần tải lên hình ảnh bản đồ.')
            if (q.hotspots.length < 1) errors.push('Cần xác định ít nhất 1 vùng chọn.')
            break
    }
    return errors
}

/* ── Main component ─────────────────────────── */

export function QuestionEditorDialog({
    question,
    isOpen,
    onClose,
    onSave,
    questionIndex = -1,
    totalQuestions = 0,
    onNavigate,
    onNew,
}: QuestionEditorDialogProps) {
    const { quizId } = useParams({ strict: false }) as { quizId: string }
    const uploadMediaMutation = useUploadMedia()
    const [editedQuestion, setEditedQuestion] = useState<Question | null>(null)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [scoreMenuOpen, setScoreMenuOpen] = useState(false)
    const [scoreMode, setScoreMode] = useState<'by_question' | 'by_answer'>('by_question')
    const [fontFamily, setFontFamily] = useState('Arial')
    const [fontSize, setFontSize] = useState('12')
    const [colorPickerOpen, setColorPickerOpen] = useState(false)
    const [currentColor, setCurrentColor] = useState('#000000')
    const [noteOpen, setNoteOpen] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const editorRef = useRef<Editor | null>(null)
    const scoreRef = useRef<HTMLDivElement>(null)
    const colorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setValidationErrors([])
        if (question) {
            setEditedQuestion({ ...question })
        } else {
            setEditedQuestion({
                id: crypto.randomUUID(),
                type: 'multiple_choice',
                text: '',
                points: { correct: 10, incorrect: 0 },
                feedback: { correct: 'Chính xác!', incorrect: 'Không chính xác!' },
                feedbackMode: 'by_question',
                attempts: 1,
                order: 0,
                timeLimit: 0,
                autoNext: false,
                options: [
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                ],
                shuffleOptions: false,
            })
        }
    }, [question, isOpen])

    if (!editedQuestion) return null

    const handleSave = () => {
        const errors = validateQuestion(editedQuestion)
        if (errors.length > 0) {
            setValidationErrors(errors)
            return
        }
        setValidationErrors([])
        onSave(editedQuestion)
    }

    const updatePoints = (field: 'correct' | 'incorrect', value: number) => {
        setEditedQuestion({
            ...editedQuestion,
            points: { ...(editedQuestion.points ?? { correct: 10, incorrect: 0 }), [field]: value },
        } as Question)
    }

    const updateGroup = (newGroup: string) => {
        setEditedQuestion({
            ...editedQuestion,
            group: newGroup === '' ? undefined : newGroup
        } as Question)
    }

    const updateFeedback = (field: 'correct' | 'incorrect', value: string) => {
        setEditedQuestion({
            ...editedQuestion,
            feedback: { ...(editedQuestion.feedback ?? { correct: '', incorrect: '' }), [field]: value },
        } as Question)
    }

    const handleUploadImage = async () => {
        const mediaId = await uploadMediaMutation.mutateAsync({ quizId })
        if (mediaId && editedQuestion) {
            setEditedQuestion({ ...editedQuestion, mediaId } as Question & { mediaId: string })
        }
    }

    const handleUploadSound = async () => {
        const mediaId = await uploadMediaMutation.mutateAsync({
            quizId,
            filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }],
        })
        if (mediaId && editedQuestion) {
            setEditedQuestion({ ...editedQuestion, audioId: mediaId } as Question & { audioId: string })
        }
    }

    const handleUploadMovie = async () => {
        const mediaId = await uploadMediaMutation.mutateAsync({
            quizId,
            filters: [{ name: 'Video', extensions: ['mp4', 'webm', 'avi', 'mov'] }],
        })
        if (mediaId && editedQuestion) {
            setEditedQuestion({ ...editedQuestion, videoId: mediaId } as Question & { videoId: string })
        }
    }

    const handleCut = () => {
        const editor = editorRef.current
        if (!editor) return
        const { from, to } = editor.state.selection
        if (from === to) return
        const text = editor.state.doc.textBetween(from, to, '\n')
        navigator.clipboard.writeText(text)
        editor.chain().focus().deleteSelection().run()
    }

    const handleCopy = () => {
        const editor = editorRef.current
        if (!editor) return
        const { from, to } = editor.state.selection
        if (from === to) return
        const text = editor.state.doc.textBetween(from, to, '\n')
        navigator.clipboard.writeText(text)
    }

    const handlePaste = async () => {
        const editor = editorRef.current
        if (!editor) return
        const text = await navigator.clipboard.readText()
        if (text) {
            editor.chain().focus().insertContent(text).run()
        }
    }

    const handleFontFamilyChange = (family: string) => {
        setFontFamily(family)
        editorRef.current?.chain().focus().setFontFamily(family).run()
    }

    const handleFontSizeChange = (size: string) => {
        setFontSize(size)
        editorRef.current?.chain().focus().setFontSize(size + 'px').run()
    }

    const handleColorChange = (color: string) => {
        setCurrentColor(color)
        setColorPickerOpen(false)
        editorRef.current?.chain().focus().setColor(color).run()
    }

    const renderEditor = () => {
        const q = editedQuestion
        switch (q.type) {
            case 'true_false':
                return <TrueFalseEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'multiple_choice':
                return <MultipleChoiceEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'multiple_response':
                return <MultipleResponseEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'fill_in_blank':
                return <FillInBlankEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'matching':
                return <MatchingEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'sequence':
                return <SequenceEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'word_bank':
                return <WordBankEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'click_map':
                return <ClickMapEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'short_essay':
                return <ShortEssayEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
            case 'blank_page':
                return <BlankPageEditor question={q} onChange={(newQ) => setEditedQuestion(newQ)} />
        }
    }

    const hasPrev = questionIndex > 0
    const hasNext = questionIndex >= 0 && questionIndex < totalQuestions - 1
    const typeLabel = QUESTION_TYPE_LABELS[editedQuestion.type] ?? editedQuestion.type
    const editorSectionLabel = EDITOR_SECTION_LABELS[editedQuestion.type] ?? 'Thiết lập câu trả lời'
    const questionMedia = editedQuestion as Question & { mediaId?: string }

    const tbBtn = "h-7 px-1.5 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-layer)]"
    const tbBtnActive = "bg-[var(--accent-subtle)]"

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                hideOverlay
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="max-w-[1100px] w-[95vw] h-[88vh] max-h-[820px] flex flex-col p-0 gap-0 overflow-hidden [&>button.absolute]:hidden"
                style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}
            >
                {/* ═══ Header ═══ */}
                <div className="h-12 flex items-center px-4 gap-3 shrink-0" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        {typeLabel}
                    </span>
                    {questionIndex >= 0 && (
                        <span className="text-xs font-mono" style={{ color: 'var(--text-disabled)' }}>
                            {questionIndex + 1} / {totalQuestions}
                        </span>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => setPreviewOpen(true)} className="ui-toolbar-btn gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Xem trước
                    </button>
                    <button
                        onClick={handleSave}
                        className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium text-white transition-all active:scale-[0.98]"
                        style={{ background: 'var(--accent)' }}
                    >
                        <Save className="w-3.5 h-3.5" /> Lưu
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 shrink-0"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ═══ Compact toolbar — Command Bar style ═══ */}
                <div className="h-9 flex items-center px-3 gap-0.5 shrink-0" style={{ background: 'var(--bg-card-alt)', borderBottom: '1px solid var(--border)' }}>
                    {/* Clipboard */}
                    <button onClick={handleCut} className={tbBtn} title="Cắt">
                        <Scissors className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <button onClick={handleCopy} className={tbBtn} title="Sao chép">
                        <CopyIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <button onClick={handlePaste} className={tbBtn} title="Dán">
                        <ClipboardPaste className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    </button>

                    <ToolbarSep />

                    {/* Font family & size */}
                    <select
                        value={fontFamily}
                        onChange={(e) => handleFontFamilyChange(e.target.value)}
                        className="h-7 text-xs px-1.5 rounded-md outline-none"
                        style={{ background: 'var(--bg-control)', border: '1px solid var(--border-control)', color: 'var(--text-primary)', maxWidth: 100 }}
                    >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Segoe UI">Segoe UI</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Courier New">Courier New</option>
                    </select>
                    <select
                        value={fontSize}
                        onChange={(e) => handleFontSizeChange(e.target.value)}
                        className="h-7 text-xs px-1 rounded-md outline-none w-12 text-center"
                        style={{ background: 'var(--bg-control)', border: '1px solid var(--border-control)', color: 'var(--text-primary)' }}
                    >
                        {['10', '12', '14', '16', '18', '20', '24'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <ToolbarSep />

                    {/* B / I / U */}
                    <button
                        onClick={() => editorRef.current?.chain().focus().toggleBold().run()}
                        className={cn(tbBtn, "w-7 font-bold text-xs", editorRef.current?.isActive('bold') && tbBtnActive)}
                        style={{ color: 'var(--text-primary)' }}
                    >B</button>
                    <button
                        onClick={() => editorRef.current?.chain().focus().toggleItalic().run()}
                        className={cn(tbBtn, "w-7 italic font-serif text-xs", editorRef.current?.isActive('italic') && tbBtnActive)}
                        style={{ color: 'var(--text-primary)' }}
                    >I</button>
                    <button
                        onClick={() => editorRef.current?.chain().focus().toggleUnderline().run()}
                        className={cn(tbBtn, "w-7 underline text-xs", editorRef.current?.isActive('underline') && tbBtnActive)}
                        style={{ color: 'var(--text-primary)' }}
                    >U</button>

                    {/* Color */}
                    <div className="relative" ref={colorRef}>
                        <button
                            onClick={() => setColorPickerOpen(!colorPickerOpen)}
                            className={cn(tbBtn, "w-7 relative")}
                            title="Màu chữ"
                        >
                            <span className="text-xs font-bold" style={{ color: currentColor }}>A</span>
                            <div className="absolute bottom-1 left-1.5 right-1.5 h-[2px] rounded-full" style={{ backgroundColor: currentColor }} />
                        </button>
                        {colorPickerOpen && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setColorPickerOpen(false)} />
                                <div className="absolute top-full left-0 mt-1 z-[61] p-2 w-[140px]"
                                    style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {['#000000','#434343','#666666','#999999','#cccccc',
                                          '#ff0000','#ff6600','#ffcc00','#33cc00','#0066ff',
                                          '#9900ff','#ff0099','#663300','#006633','#003366',
                                          '#800000','#ff9999','#ffcc99','#ffffcc','#ccffcc'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => handleColorChange(c)}
                                                className={cn("w-5 h-5 rounded-md border transition-transform hover:scale-110", c === currentColor ? "ring-2 ring-offset-1" : "")}
                                                style={{ backgroundColor: c, borderColor: c === currentColor ? 'var(--accent)' : 'var(--border)' }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <ToolbarSep />

                    {/* Insert: Image, Sound, Movie */}
                    <button onClick={handleUploadImage} className={tbBtn} title="Chèn ảnh">
                        <ImageIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <button onClick={handleUploadSound}
                        className={cn(tbBtn, (editedQuestion as Question & { audioId?: string }).audioId && "bg-emerald-50")}
                        title="Chèn âm thanh">
                        <Music className="w-3.5 h-3.5" style={{ color: (editedQuestion as Question & { audioId?: string }).audioId ? '#059669' : 'var(--text-secondary)' }} />
                    </button>
                    <button onClick={handleUploadMovie}
                        className={cn(tbBtn, (editedQuestion as Question & { videoId?: string }).videoId && "bg-emerald-50")}
                        title="Chèn video">
                        <Video className="w-3.5 h-3.5" style={{ color: (editedQuestion as Question & { videoId?: string }).videoId ? '#059669' : 'var(--text-secondary)' }} />
                    </button>

                    <ToolbarSep />

                    {/* Note */}
                    <button
                        onClick={() => setNoteOpen(!noteOpen)}
                        className={cn(tbBtn, "gap-1 px-2 text-xs", noteOpen && "bg-amber-50")}
                        style={{ color: noteOpen || (editedQuestion as Question & { note?: string }).note ? '#92400e' : 'var(--text-secondary)' }}
                        title="Ghi chú"
                    >
                        <StickyNote className="w-3.5 h-3.5" /> Note
                    </button>

                    {/* Disabled: Equation, Spell */}
                    <button className="h-7 px-1.5 rounded-md flex items-center justify-center opacity-35 cursor-not-allowed" title="Sắp ra mắt">
                        <Sigma className="w-3.5 h-3.5" style={{ color: 'var(--text-disabled)' }} />
                    </button>
                    <button className="h-7 px-1.5 rounded-md flex items-center justify-center opacity-35 cursor-not-allowed" title="Sắp ra mắt">
                        <SpellCheck className="w-3.5 h-3.5" style={{ color: 'var(--text-disabled)' }} />
                    </button>
                </div>

                {/* ═══ Main content ═══ */}
                <div className="flex-1 overflow-auto p-5 flex flex-col gap-5 min-h-0" style={{ background: 'var(--bg-app)' }}>
                    {/* Enter the question */}
                    <div className="ui-card overflow-hidden">
                        <div className="flex">
                            <div className="flex-1 min-h-[100px]">
                                <div className="px-4 pt-3 pb-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-disabled)' }}>
                                        Câu hỏi
                                    </span>
                                </div>
                                <RichTextEditor
                                    content={editedQuestion.text || ""}
                                    onChange={(content) => setEditedQuestion({ ...editedQuestion, text: content } as Question)}
                                    placeholder="Nhập nội dung câu hỏi tại đây..."
                                    onEditorReady={(editor) => { editorRef.current = editor }}
                                />
                            </div>
                            <div
                                className="w-[80px] shrink-0 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all rounded-r-[var(--r-lg)]"
                                style={{ background: 'var(--bg-app)' }}
                                onClick={handleUploadImage}
                                title="Nhấn để thêm hình ảnh / video"
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-layer)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-app)')}
                            >
                                {questionMedia.mediaId ? (
                                    <div className="relative p-1 w-full h-full flex items-center justify-center">
                                        <MediaPreview mediaId={questionMedia.mediaId} />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditedQuestion({ ...editedQuestion, mediaId: undefined } as Question & { mediaId?: string })
                                            }}
                                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                            title="Gỡ bỏ"
                                        >
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 opacity-25">
                                        <ImageIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                                        <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Thêm ảnh</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Type-specific editor */}
                    <div>
                        <div className="px-1 mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-disabled)' }}>
                                {editorSectionLabel}
                            </span>
                        </div>
                        <div className="ui-card overflow-hidden">
                            {renderEditor()}
                        </div>
                    </div>

                    {/* Feedback, Points, Settings */}
                    {editedQuestion.type !== 'blank_page' && (
                        <div>
                            <div className="px-1 mb-2">
                                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-disabled)' }}>
                                    Phản hồi & Điểm số
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Correct */}
                                <div className="p-3.5 rounded-xl" style={{ background: '#f0fdf4' }}>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-xs font-semibold text-emerald-700">Trả lời đúng</span>
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3 h-3 text-amber-400" />
                                            <input
                                                type="number"
                                                min={0}
                                                max={999}
                                                value={editedQuestion.points?.correct ?? 10}
                                                onChange={(e) => updatePoints('correct', Math.max(0, parseInt(e.target.value) || 0))}
                                                className="w-14 h-7 text-center text-xs font-bold rounded-lg outline-none transition-shadow focus:ring-2 focus:ring-emerald-200"
                                                style={{ background: 'white', color: 'var(--text-primary)' }}
                                            />
                                            <span className="text-[10px] text-emerald-500 font-medium">điểm</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={editedQuestion.feedback?.correct || ''}
                                        onChange={(e) => updateFeedback('correct', e.target.value)}
                                        placeholder="Chính xác !"
                                        className="w-full h-8 px-3 text-xs rounded-lg outline-none transition-shadow focus:ring-2 focus:ring-emerald-200"
                                        style={{ background: 'white', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {/* Incorrect */}
                                <div className="p-3.5 rounded-xl" style={{ background: '#fef2f2' }}>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-xs font-semibold text-red-700">Trả lời sai</span>
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3 h-3 text-red-300" />
                                            <input
                                                type="number"
                                                min={-99}
                                                max={999}
                                                value={editedQuestion.points?.incorrect ?? 0}
                                                onChange={(e) => updatePoints('incorrect', parseInt(e.target.value) || 0)}
                                                className="w-14 h-7 text-center text-xs font-bold rounded-lg outline-none transition-shadow focus:ring-2 focus:ring-red-200"
                                                style={{ background: 'white', color: 'var(--text-primary)' }}
                                            />
                                            <span className="text-[10px] text-red-400 font-medium">điểm</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={editedQuestion.feedback?.incorrect || ''}
                                        onChange={(e) => updateFeedback('incorrect', e.target.value)}
                                        placeholder="Không chính xác !"
                                        className="w-full h-8 px-3 text-xs rounded-lg outline-none transition-shadow focus:ring-2 focus:ring-red-200"
                                        style={{ background: 'white', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>

                            {/* Settings row */}
                            <div className="flex items-center gap-4 mt-4 pt-3 flex-wrap">
                                {/* Score mode */}
                                <div className="relative" ref={scoreRef}>
                                    <button
                                        onClick={() => setScoreMenuOpen(!scoreMenuOpen)}
                                        className="ui-toolbar-btn gap-1.5 text-xs"
                                    >
                                        <Star className="w-3.5 h-3.5 text-amber-500" />
                                        Score: {scoreMode === 'by_question' ? 'By Question' : 'By Answer'}
                                        <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-disabled)' }} />
                                    </button>
                                    {scoreMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[60]" onClick={() => setScoreMenuOpen(false)} />
                                            <div className="absolute top-full left-0 mt-1 z-[61] py-1 min-w-[140px]"
                                                style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                                                {(['by_question', 'by_answer'] as const).map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => { setScoreMode(mode); setScoreMenuOpen(false) }}
                                                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors hover:bg-[var(--bg-app)]"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                                                            scoreMode === mode ? "border-[var(--accent)]" : "border-[var(--border-strong)]"
                                                        )}>
                                                            {scoreMode === mode && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                                                        </div>
                                                        {mode === 'by_question' ? 'By Question' : 'By Answer'}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <ToolbarSep />

                                {/* Attempts */}
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Attempts:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={9}
                                        value={editedQuestion.attempts ?? 1}
                                        onChange={(e) => setEditedQuestion({ ...editedQuestion, attempts: Math.min(9, Math.max(1, parseInt(e.target.value) || 1)) } as Question)}
                                        className="w-10 h-6 text-center text-xs font-medium rounded-md outline-none"
                                        style={{ background: 'var(--bg-app)', border: '1px solid var(--border-control)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <ToolbarSep />

                                {/* Time Limit */}
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                                    <span>Thời gian:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={3600}
                                        value={editedQuestion.timeLimit ?? 0}
                                        onChange={(e) => setEditedQuestion({ ...editedQuestion, timeLimit: Math.max(0, parseInt(e.target.value) || 0) } as Question)}
                                        className="w-14 h-6 text-center text-xs font-medium rounded-md outline-none"
                                        style={{ background: 'var(--bg-app)', border: '1px solid var(--border-control)', color: 'var(--text-primary)' }}
                                    />
                                    <span style={{ color: 'var(--text-tertiary)' }}>giây</span>
                                </div>

                                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                    <input
                                        type="checkbox"
                                        checked={editedQuestion.autoNext ?? false}
                                        onChange={(e) => setEditedQuestion({ ...editedQuestion, autoNext: e.target.checked } as Question)}
                                        className="w-3.5 h-3.5 rounded"
                                        style={{ accentColor: 'var(--accent)' }}
                                    />
                                    Auto Next
                                </label>

                                <ToolbarSep />

                                {/* Group */}
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Nhóm:</span>
                                    <input
                                        type="text"
                                        placeholder="(tùy chọn)"
                                        value={editedQuestion.group || ''}
                                        onChange={(e) => updateGroup(e.target.value)}
                                        className="w-24 h-6 px-2 text-xs rounded-md outline-none"
                                        style={{ background: 'var(--bg-app)', border: '1px solid var(--border-control)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="flex-1" />

                                {/* Feedback mode */}
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <span>Feedback:</span>
                                    <select
                                        value={editedQuestion.feedbackMode ?? 'by_question'}
                                        onChange={(e) => setEditedQuestion({ ...editedQuestion, feedbackMode: e.target.value as 'by_question' | 'by_choice' | 'none' } as Question)}
                                        className="h-6 text-xs px-1.5 rounded-md outline-none"
                                        style={{ background: 'var(--bg-app)', border: '1px solid var(--border-control)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="by_question">By Question</option>
                                        <option value="by_choice">By Choice</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>

                                {/* Branching (disabled) */}
                                <div className="flex items-center gap-1 text-xs opacity-35 cursor-not-allowed" title="Sắp ra mắt">
                                    <GitBranch className="w-3 h-3" style={{ color: 'var(--text-disabled)' }} />
                                    <span style={{ color: 'var(--text-disabled)' }}>Branch</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Note panel */}
                    {noteOpen && (
                        <div className="rounded-xl p-4" style={{ background: '#fffbeb' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <StickyNote className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#92400e' }}>
                                    Ghi chú giáo viên
                                </span>
                            </div>
                            <textarea
                                value={(editedQuestion as Question & { note?: string }).note || ''}
                                onChange={(e) => setEditedQuestion({ ...editedQuestion, note: e.target.value } as Question & { note: string })}
                                placeholder="Ghi chú nội bộ cho câu hỏi này (không hiển thị cho học sinh)..."
                                className="w-full h-16 text-xs px-3 py-2 rounded-lg outline-none resize-none transition-shadow focus:ring-2 focus:ring-amber-200"
                                style={{ background: 'white', color: 'var(--text-primary)' }}
                            />
                        </div>
                    )}
                </div>

                {/* ═══ Preview overlay ═══ */}
                {previewOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--bg-overlay)' }}>
                        <div className="w-[600px] max-h-[70vh] flex flex-col overflow-hidden"
                            style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)' }}>
                            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Xem trước câu hỏi</span>
                                <button onClick={() => setPreviewOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-app)]">
                                    <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{typeLabel}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{editedQuestion.points?.correct ?? 10} điểm</span>
                                </div>
                                <div className="prose prose-sm max-w-none mb-4" dangerouslySetInnerHTML={{ __html: editedQuestion.text || '<em class="text-slate-400">Chưa có nội dung</em>' }} />
                                {questionMedia.mediaId && (
                                    <div className="mb-4">
                                        <MediaPreview mediaId={questionMedia.mediaId} />
                                    </div>
                                )}
                                <PreviewAnswers question={editedQuestion} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Validation errors ═══ */}
                {validationErrors.length > 0 && (
                    <div className="px-4 py-2 bg-red-50 flex items-start gap-2 shrink-0" style={{ borderTop: '1px solid #fecaca' }}>
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {validationErrors.map((err, i) => (
                                <span key={i} className="text-xs text-red-600">{err}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ Footer ═══ */}
                <div className="h-12 px-4 flex items-center justify-between shrink-0" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={!hasPrev}
                            onClick={() => onNavigate?.('prev')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-app)] disabled:opacity-25 disabled:cursor-not-allowed"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={!hasNext}
                            onClick={() => onNavigate?.('next')}
                            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-app)] disabled:opacity-25 disabled:cursor-not-allowed"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
                        <button
                            onClick={onNew}
                            disabled={!onNew}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-app)] disabled:opacity-25 disabled:cursor-not-allowed"
                            style={{ color: 'var(--accent)' }}
                        >
                            <Plus className="w-3.5 h-3.5" /> Thêm câu mới
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="h-8 px-4 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--bg-app)]"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="h-8 px-5 text-xs font-medium text-white rounded-lg transition-all active:scale-[0.98] hover:brightness-110"
                            style={{ background: 'var(--accent)' }}
                        >
                            Lưu câu hỏi
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function MediaPreview({ mediaId }: { mediaId: string }) {
    const { data: base64Data, isLoading } = useMediaData(mediaId)

    if (isLoading) return <div className="w-16 h-16 animate-pulse rounded-lg" style={{ background: 'var(--bg-layer)' }} />
    if (!base64Data) return null

    return (
        <img
            src={base64Data}
            className="max-w-full max-h-20 object-contain"
            style={{ borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-sm)' }}
            alt="Hình câu hỏi"
        />
    )
}

function PreviewAnswers({ question }: { question: Question }) {
    const labelCls = "text-xs leading-relaxed"
    const correctCls = "text-emerald-600 font-medium"

    switch (question.type) {
        case 'true_false':
            return (
                <div className="flex gap-4">
                    <label className={cn(labelCls, "flex items-center gap-2")} style={{ color: 'var(--text-secondary)' }}>
                        <input type="radio" checked={question.correctAnswer === 'true'} readOnly className="w-3.5 h-3.5" style={{ accentColor: 'var(--accent)' }} />
                        <span className={question.correctAnswer === 'true' ? correctCls : ''}>Đúng</span>
                    </label>
                    <label className={cn(labelCls, "flex items-center gap-2")} style={{ color: 'var(--text-secondary)' }}>
                        <input type="radio" checked={question.correctAnswer === 'false'} readOnly className="w-3.5 h-3.5" style={{ accentColor: 'var(--accent)' }} />
                        <span className={question.correctAnswer === 'false' ? correctCls : ''}>Sai</span>
                    </label>
                </div>
            )
        case 'multiple_choice':
        case 'multiple_response':
            return (
                <div className="flex flex-col gap-1.5">
                    {question.options.map((opt, i) => (
                        <div key={opt.id} className={cn(labelCls, "flex items-center gap-2 px-3 py-1.5 rounded-lg", opt.isCorrect && "bg-emerald-50")}
                            style={{ color: 'var(--text-secondary)' }}>
                            <input type={question.type === 'multiple_choice' ? 'radio' : 'checkbox'} checked={opt.isCorrect} readOnly className="w-3.5 h-3.5" style={{ accentColor: 'var(--accent)' }} />
                            <span className={opt.isCorrect ? correctCls : ''}>{String.fromCharCode(65 + i)}. {opt.text || '(trống)'}</span>
                        </div>
                    ))}
                </div>
            )
        case 'fill_in_blank':
            return (
                <div className={labelCls} style={{ color: 'var(--text-secondary)' }}>
                    <p className="mb-1 font-medium">Mẫu: {question.templateText}</p>
                    {question.blanks.map((b, i) => (
                        <div key={i} className="ml-2">Chỗ trống {i + 1}: <span className={correctCls}>{b.acceptableAnswers.join(' / ')}</span></div>
                    ))}
                </div>
            )
        case 'matching':
            return (
                <div className="flex flex-col gap-1">
                    {question.pairs.map((p, i) => (
                        <div key={i} className={cn(labelCls, "flex items-center gap-2")} style={{ color: 'var(--text-secondary)' }}>
                            <span className="font-medium">{p.choice}</span>
                            <span style={{ color: 'var(--text-disabled)' }}>→</span>
                            <span className={correctCls}>{p.match}</span>
                        </div>
                    ))}
                </div>
            )
        case 'sequence':
            return (
                <div className="flex flex-col gap-1">
                    {question.items.map((item, i) => (
                        <div key={i} className={cn(labelCls, "flex items-center gap-2")} style={{ color: 'var(--text-secondary)' }}>
                            <span className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>{i + 1}</span>
                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>
            )
        case 'word_bank':
            return (
                <div className={labelCls} style={{ color: 'var(--text-secondary)' }}>
                    <p className="mb-1 font-medium">Mẫu: {question.templateText}</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                        {question.words.map((w, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md text-[10px]"
                                style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{w.text}</span>
                        ))}
                    </div>
                </div>
            )
        case 'short_essay':
            return (
                <div className={labelCls} style={{ color: 'var(--text-secondary)' }}>
                    <p className="italic" style={{ color: 'var(--text-tertiary)' }}>Câu hỏi tự luận — chấm thủ công hoặc theo từ khóa</p>
                    {question.keywordMatching.length > 0 && (
                        <div className="mt-1">Từ khóa: {question.keywordMatching.join(', ')}</div>
                    )}
                </div>
            )
        case 'click_map':
            return (
                <div className={labelCls} style={{ color: 'var(--text-secondary)' }}>
                    <p>{question.hotspots.length} vùng tương tác đã xác định</p>
                </div>
            )
        case 'blank_page':
            return <div className={labelCls}><p className="italic" style={{ color: 'var(--text-tertiary)' }}>Trang nội dung — không có câu trả lời</p></div>
        default:
            return null
    }
}
