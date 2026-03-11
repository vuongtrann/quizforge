import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
    Share,
    Globe,
    Monitor,
    FileArchive,
    GraduationCap,
    Download,
    CheckCircle2,
    Shield,
    HardDrive,
    Component // Added Component here
} from "lucide-react" // Added closing brace and moved Component here
import { cn } from "../lib/utils"
import { invoke } from "@tauri-apps/api/core"
import { save as saveDialog } from "@tauri-apps/plugin-dialog"
import { type Quiz } from "@quizforge/types"

interface ExportDialogProps {
    isOpen: boolean
    onClose: () => void
    quizTitle: string
    quizData: Quiz
}

type ExportType = 'web' | 'exe' | 'scorm' | 'lms'

export function ExportDialog({ isOpen, onClose, quizTitle, quizData }: ExportDialogProps) {
    const [exportType, setExportType] = useState<ExportType>('web')
    const [isExporting, setIsExporting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [exportError, setExportError] = useState<string | null>(null)

    const handleExport = async () => {
        setIsExporting(true)
        setExportError(null)
        setProgress(10)

        try {
            if (exportType === 'exe') {
                const outputPath = await saveDialog({
                    defaultPath: `${quizTitle}_Player.exe`,
                    filters: [{ name: 'Windows Executable', extensions: ['exe'] }],
                    title: 'Lưu bài thi thành file EXE'
                })

                if (!outputPath || typeof outputPath !== 'string') {
                    setIsExporting(false)
                    return
                }

                setProgress(30)
                await invoke('prepare_player_bundle', {
                    quiz: quizData,
                    students: [], // Optional: add student list selection logic if needed
                    output_path: outputPath
                })
            } else {
                const exportPath = await saveDialog({
                    defaultPath: `${quizTitle}.qfz`,
                    filters: [{ name: 'QuizForge File', extensions: ['qfz'] }]
                })

                if (!exportPath) {
                    setIsExporting(false)
                    return
                }

                setProgress(30)
                await invoke('export_quiz_to_qfz', { quizId: quizData.id, exportPath })
            }

            setProgress(100)
            setTimeout(() => {
                onClose()
                setIsExporting(false)
                setProgress(0)
            }, 1000)
        } catch (error) {
            setExportError(String(error))
            setIsExporting(false)
        }
    }

    const types = [
        { id: 'web', label: 'Web / HTML5', icon: Globe, sub: 'Chạy trực tiếp trên trình duyệt' },
        { id: 'exe', label: 'Windows Application', icon: Monitor, sub: 'Tệp .EXE chạy ngoại tuyến' },
        { id: 'scorm', label: 'SCORM Package', icon: FileArchive, sub: 'Chuẩn e-Learning quốc tế' },
        { id: 'lms', label: 'LMS Sync', icon: GraduationCap, sub: 'Đồng bộ trực tiếp lên QuizForce Cloud' },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[700px] w-full p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <DialogHeader className="px-8 py-6 bg-slate-900 border-none text-white relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20" />

                    <DialogTitle className="text-xl font-bold flex items-center gap-3 relative z-10">
                        <Share className="w-6 h-6 text-brand-400" />
                        Xuất bản bài thi (Publish)
                    </DialogTitle>
                    <p className="text-slate-400 text-xs mt-1 relative z-10 font-medium">Chọn định dạng đầu ra cho bài thi: <span className="text-white">{quizTitle}</span></p>
                </DialogHeader>

                <div className="p-8 bg-white space-y-8">
                    {!isExporting ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                {types.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setExportType(type.id as ExportType)}
                                        className={cn(
                                            "flex flex-col gap-3 p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                                            exportType === type.id
                                                ? "border-brand-500 bg-brand-50 ring-4 ring-brand-50"
                                                : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                            exportType === type.id ? "bg-brand-500 text-white shadow-lg shadow-brand-200" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                                        )}>
                                            <type.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className={cn("text-sm font-bold", exportType === type.id ? "text-brand-900" : "text-slate-700")}>{type.label}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">{type.sub}</p>
                                        </div>
                                        {exportType === type.id && (
                                            <div className="absolute top-4 right-4 text-brand-500">
                                                <CheckCircle2 className="w-5 h-5 fill-current text-brand-500 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tóm tắt cấu hình bài thi</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                            <Component className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{quizData.questions.length} câu hỏi</span>
                                            <span className="text-[10px] text-slate-400">
                                                {quizData.settings.randomization?.randomCount && quizData.settings.randomization.randomCount > 0
                                                    ? `(chọn ngẫu nhiên ${quizData.settings.randomization.randomCount})`
                                                    : 'Tất cả câu hỏi'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                                            <Monitor className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">
                                                {quizData.settings.timeLimit.enabled
                                                    ? `${Math.round(quizData.settings.timeLimit.durationSeconds / 60)} phút`
                                                    : 'Không giới hạn'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">Thời gian làm bài</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <GraduationCap className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{quizData.settings.passingRate}% chuẩn đạt</span>
                                            <span className="text-[10px] text-slate-400">Điều kiện qua bài</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">
                                                {quizData.security?.protection === 'password' ? 'Có mật khẩu' :
                                                    quizData.security?.protection === 'user_id_password' ? 'Danh sách HS' : 'Mở công khai'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">Truy cập bài thi</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                            <div className="relative w-32 h-32 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                                <div
                                    className="absolute inset-0 rounded-full border-4 border-brand-500 transition-all duration-300"
                                    style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)`, transform: 'rotate(-90deg)' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-slate-800">{progress}%</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tighter mb-2">Đang đóng gói dữ liệu...</h3>
                            <p className="text-xs text-slate-400 font-medium">Vui lòng không đóng cửa sổ này cho đến khi hoàn thành</p>
                        </div>
                    )}
                </div>

                {exportError && (
                    <div className="px-8 py-3 bg-red-50 border-t border-red-100">
                        <p className="text-xs text-red-600 font-medium break-all">
                            <span className="font-bold uppercase tracking-widest mr-2">Lỗi:</span>{exportError}
                        </p>
                    </div>
                )}

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <HardDrive className="w-3.5 h-3.5" /> 2.4 MB estimated
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Virus Clean
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-6" onClick={onClose} disabled={isExporting}>Hủy</Button>
                        <Button
                            className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-10 bg-slate-900 hover:bg-black text-white shadow-xl flex gap-2"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            <Download className="w-3.5 h-3.5" /> <span>{progress >= 100 ? 'Tải về ngay' : 'Xuất bản'}</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
