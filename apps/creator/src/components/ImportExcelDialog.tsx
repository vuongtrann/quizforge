/**
 * ImportExcelDialog — Import quiz from Excel file
 * Supports: TF, MC, MR, FB, MT, SQ question types
 */
import { useState } from 'react'
import { open as openFileDialog, save as saveFileDialog } from '@tauri-apps/plugin-dialog'
import {
    FileSpreadsheet, Download, Upload, X, CheckCircle,
    AlertTriangle, FileText, Loader2,
} from 'lucide-react'
import {
    useGenerateImportTemplate,
    useImportQuizFromExcel,
    type ExcelImportResult,
} from '../hooks/useQuizzes'

interface ImportExcelDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: (quizId: string) => void
}

export function ImportExcelDialog({ open: isOpen, onClose, onSuccess }: ImportExcelDialogProps) {
    const [quizTitle, setQuizTitle] = useState('Quiz từ Excel')
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [result, setResult] = useState<ExcelImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const generateTemplate = useGenerateImportTemplate()
    const importExcel = useImportQuizFromExcel()

    if (!isOpen) return null

    const handleDownloadTemplate = async () => {
        const outputPath = await saveFileDialog({
            defaultPath: 'QuizForge_Template.xlsx',
            filters: [{ name: 'Excel File', extensions: ['xlsx'] }],
        })
        if (outputPath) {
            try {
                await generateTemplate.mutateAsync(outputPath)
            } catch (err) {
                setError(String(err))
            }
        }
    }

    const handleSelectFile = async () => {
        const selected = await openFileDialog({
            multiple: false,
            filters: [{ name: 'Excel File', extensions: ['xlsx', 'xls'] }],
        })
        if (selected && typeof selected === 'string') {
            setSelectedFile(selected)
            setResult(null)
            setError(null)
        }
    }

    const handleImport = async () => {
        if (!selectedFile) return
        setError(null)
        setResult(null)
        try {
            const res = await importExcel.mutateAsync({
                filePath: selectedFile,
                quizTitle: quizTitle || 'Quiz từ Excel',
            })
            setResult(res)
        } catch (err) {
            setError(String(err))
        }
    }

    const handleClose = () => {
        setSelectedFile(null)
        setResult(null)
        setError(null)
        setQuizTitle('Quiz từ Excel')
        onClose()
    }

    const handleOpenQuiz = () => {
        if (result?.quizId) {
            onSuccess(result.quizId)
            handleClose()
        }
    }

    const fileName = selectedFile?.split(/[/\\]/).pop() ?? ''

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
            <div
                className="w-[540px] max-h-[85vh] overflow-auto animate-scale-in"
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--border)' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 flex items-center justify-center"
                            style={{ background: '#E8F5E9', borderRadius: 'var(--r-md)' }}
                        >
                            <FileSpreadsheet className="w-5 h-5" style={{ color: '#2E7D32' }} />
                        </div>
                        <div>
                            <h2 className="font-semibold" style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-primary)' }}>
                                Import từ Excel
                            </h2>
                            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-tertiary)' }}>
                                Nhập câu hỏi từ file .xlsx
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="ui-toolbar-btn h-8 w-8 p-0 justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    {/* Step 1: Download template */}
                    <div
                        className="p-4"
                        style={{
                            background: 'var(--bg-layer)',
                            borderRadius: 'var(--r-lg)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                className="w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
                                style={{ background: 'var(--accent)', borderRadius: 'var(--r-full)' }}
                            >
                                1
                            </span>
                            <div className="flex-1">
                                <p className="font-semibold mb-1" style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-primary)' }}>
                                    Tải template mẫu
                                </p>
                                <p className="mb-3" style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-secondary)' }}>
                                    File Excel có sẵn cấu trúc cột và ví dụ. Hỗ trợ 6 loại: Đúng/Sai (TF), Trắc nghiệm (MC), Nhiều đáp án (MR), Điền chỗ trống (FB), Nối cặp (MT), Sắp xếp (SQ).
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    disabled={generateTemplate.isPending}
                                    className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                                    style={{
                                        background: 'var(--bg-control)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--r-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <Download className="w-4 h-4" />
                                    {generateTemplate.isPending ? 'Đang tạo...' : 'Tải Template (.xlsx)'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Quiz title + Select file */}
                    <div
                        className="p-4"
                        style={{
                            background: 'var(--bg-layer)',
                            borderRadius: 'var(--r-lg)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                className="w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
                                style={{ background: 'var(--accent)', borderRadius: 'var(--r-full)' }}
                            >
                                2
                            </span>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <p className="font-semibold mb-1" style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-primary)' }}>
                                        Đặt tên quiz và chọn file
                                    </p>
                                </div>

                                <div>
                                    <label
                                        className="block mb-1 font-medium"
                                        style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-secondary)' }}
                                    >
                                        Tên Quiz
                                    </label>
                                    <input
                                        type="text"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                        placeholder="Nhập tên quiz..."
                                        className="ui-input w-full"
                                        style={{ borderRadius: 'var(--r-md)' }}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSelectFile}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-semibold transition-all active:scale-[0.98]"
                                        style={{
                                            background: 'var(--bg-control)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--r-md)',
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Chọn file Excel
                                    </button>
                                    {selectedFile && (
                                        <span
                                            className="text-sm truncate max-w-[250px]"
                                            style={{ color: 'var(--text-secondary)' }}
                                            title={selectedFile}
                                        >
                                            {fileName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="flex items-start gap-2 p-3 text-sm"
                            style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: 'var(--r-md)',
                                color: '#DC2626',
                            }}
                        >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div
                            className="p-4"
                            style={{
                                background: result.errors.length > 0 ? '#FFFBEB' : '#F0FDF4',
                                border: `1px solid ${result.errors.length > 0 ? '#FDE68A' : '#BBF7D0'}`,
                                borderRadius: 'var(--r-lg)',
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5" style={{ color: '#16A34A' }} />
                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Import thành công!
                                </span>
                            </div>
                            <div className="space-y-1" style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-secondary)' }}>
                                <p>Quiz: <strong>{result.title}</strong></p>
                                <p>Đã import: <strong>{result.imported}/{result.total}</strong> câu hỏi</p>
                                <p>Tổng điểm: <strong>{result.totalPoints}</strong></p>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #FDE68A' }}>
                                    <p className="font-medium mb-1 text-amber-700" style={{ fontSize: 'var(--font-size-caption)' }}>
                                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                                        Một số dòng bị lỗi:
                                    </p>
                                    <ul className="space-y-0.5" style={{ fontSize: '11px', color: '#92400E' }}>
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-2 px-5 py-3"
                    style={{ borderTop: '1px solid var(--border)' }}
                >
                    {result ? (
                        <>
                            <button
                                onClick={handleClose}
                                className="inline-flex items-center gap-1.5 h-8 px-4 text-sm font-semibold transition-all active:scale-[0.98]"
                                style={{
                                    background: 'var(--bg-control)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--r-md)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleOpenQuiz}
                                className="inline-flex items-center gap-1.5 h-8 px-4 text-white text-sm font-semibold transition-all active:scale-[0.98]"
                                style={{
                                    background: 'var(--accent)',
                                    borderRadius: 'var(--r-md)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                Mở Quiz
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleClose}
                                className="inline-flex items-center gap-1.5 h-8 px-4 text-sm font-semibold transition-all active:scale-[0.98]"
                                style={{
                                    background: 'var(--bg-control)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--r-md)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!selectedFile || importExcel.isPending}
                                className="inline-flex items-center gap-1.5 h-8 px-4 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                                style={{
                                    background: !selectedFile ? 'var(--text-disabled)' : '#2E7D32',
                                    borderRadius: 'var(--r-md)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                {importExcel.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang import...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Import
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
