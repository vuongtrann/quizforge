import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
    Info,
    Settings,
    Award,
    Shield,
    Component,
    Clock,
    Lock,
    Eye,
    Users,
    Mail,
    Globe
} from "lucide-react"
import { cn } from "../lib/utils"
import { Quiz } from "@quizforge/types"
import { RichTextEditor } from "./RichTextEditor"

interface QuizPropertiesDialogProps {
    quiz: Quiz
    isOpen: boolean
    onClose: () => void
    onSave: (quiz: Quiz) => void
}

type TabType = 'info' | 'settings' | 'result' | 'questions' | 'security' | 'other'

export function QuizPropertiesDialog({ quiz, isOpen, onClose, onSave }: QuizPropertiesDialogProps) {
    const [activeTab, setActiveTab] = useState<TabType>('info')
    const [editedQuiz, setEditedQuiz] = useState<Quiz | null>(null)

    useEffect(() => {
        if (quiz && isOpen) {
            setEditedQuiz(JSON.parse(JSON.stringify(quiz)))
        }
    }, [quiz, isOpen])

    if (!editedQuiz) return null

    const handleSave = () => {
        onSave(editedQuiz)
        onClose()
    }

    const updateInfo = (fields: any) => {
        setEditedQuiz({
            ...editedQuiz,
            information: { ...editedQuiz.information, ...fields }
        })
    }

    const updateSettings = (fields: any) => {
        setEditedQuiz({
            ...editedQuiz,
            settings: { ...editedQuiz.settings, ...fields }
        })
    }

    const updateResult = (fields: any) => {
        setEditedQuiz({
            ...editedQuiz,
            result: { ...editedQuiz.result, ...fields }
        })
    }

    const updateSecurity = (fields: any) => {
        setEditedQuiz({
            ...editedQuiz,
            security: { ...editedQuiz.security, ...fields }
        })
    }

    const tabs = [
        { id: 'info', label: 'Thông tin Quiz', icon: Info },
        { id: 'settings', label: 'Cài đặt Quiz', icon: Settings },
        { id: 'result', label: 'Kết quả Quiz', icon: Award },
        { id: 'questions', label: 'Cài đặt Câu hỏi', icon: Component },
        { id: 'security', label: 'Bảo mật', icon: Shield },
        { id: 'other', label: 'Khác (Email, Meta)', icon: Mail },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[850px] w-full h-[650px] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50 flex-shrink-0">
                    <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-brand-600" />
                        Thiết lập bài thi
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-[220px] bg-slate-50 border-r border-slate-200 p-2 flex flex-col gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                        activeTab === tab.id
                                            ? "bg-white text-brand-700 shadow-sm border border-slate-200 ring-1 ring-black/5"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", activeTab === tab.id ? "text-brand-600" : "text-slate-400")} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        {activeTab === 'info' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Thông tin định danh</h3>
                                    <div className="grid gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bài thi</label>
                                            <input
                                                type="text"
                                                autoFocus
                                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white text-base font-bold text-slate-700 transition-all outline-none"
                                                placeholder="Nhập tên bài thi..."
                                                value={editedQuiz.information.title}
                                                onChange={(e) => updateInfo({ title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tác giả / Giáo viên</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white text-sm text-slate-600 transition-all outline-none"
                                                placeholder="Tên giáo viên hoặc tổ chức..."
                                                value={editedQuiz.information.author || ''}
                                                onChange={(e) => updateInfo({ author: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mô tả tóm tắt</label>
                                            <textarea
                                                className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:bg-white text-sm text-slate-600 transition-all resize-none outline-none leading-relaxed"
                                                placeholder="Mô tả nội dung hoặc hướng dẫn chung..."
                                                value={editedQuiz.information.description || ''}
                                                onChange={(e) => updateInfo({ description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Trang chào mừng</h3>
                                    <div className="grid gap-3">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl group hover:border-brand-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                                                    <Eye className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Kích hoạt trang giới thiệu</p>
                                                    <p className="text-[10px] text-slate-400">Hiển thị thông tin bài thi trước khi nhấn nút Bắt đầu</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                    checked={editedQuiz.information.introduction.enabled}
                                                    onChange={(e) => updateInfo({
                                                        introduction: { ...editedQuiz.information.introduction, enabled: e.target.checked }
                                                    })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl group hover:border-brand-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Thu thập thông tin người làm bài</p>
                                                    <p className="text-[10px] text-slate-400">Yêu cầu nhập Họ tên, Lớp, Mã HS trước khi vào thi</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                checked={editedQuiz.information.collectParticipantData.enabled}
                                                onChange={(e) => updateInfo({
                                                    collectParticipantData: { ...editedQuiz.information.collectParticipantData, enabled: e.target.checked }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Chấm điểm & Thời gian</h3>
                                        <div className="space-y-5">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                                                    <span>Tỷ lệ đạt chuẩn</span>
                                                    <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{editedQuiz.settings.passingRate}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0" max="100" step="5"
                                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                                    value={editedQuiz.settings.passingRate}
                                                    onChange={(e) => updateSettings({ passingRate: parseInt(e.target.value) })}
                                                />
                                            </div>

                                            <div className={cn(
                                                "p-4 border rounded-2xl transition-all duration-300",
                                                editedQuiz.settings.timeLimit.enabled ? "bg-amber-50/30 border-amber-200 shadow-sm" : "bg-slate-50 border-slate-200"
                                            )}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <Clock className={cn("w-5 h-5", editedQuiz.settings.timeLimit.enabled ? "text-amber-500" : "text-slate-400")} />
                                                        <span className="text-xs font-bold text-slate-700">Giới hạn thời gian</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                                        checked={editedQuiz.settings.timeLimit.enabled}
                                                        onChange={(e) => updateSettings({
                                                            timeLimit: { ...editedQuiz.settings.timeLimit, enabled: e.target.checked }
                                                        })}
                                                    />
                                                </div>

                                                {editedQuiz.settings.timeLimit.enabled && (
                                                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1 ml-1">Giây (Seconds)</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full h-10 px-3 bg-white border border-amber-200 rounded-xl text-base font-mono font-bold text-amber-900 shadow-inner outline-none focus:ring-1 focus:ring-amber-500"
                                                                    value={editedQuiz.settings.timeLimit.durationSeconds}
                                                                    onChange={(e) => updateSettings({
                                                                        timeLimit: { ...editedQuiz.settings.timeLimit, durationSeconds: parseInt(e.target.value) }
                                                                    })}
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1 ml-1">Phút (Mins)</label>
                                                                <div className="w-full h-10 flex items-center px-4 bg-slate-100 rounded-xl text-sm font-bold text-slate-500 border border-transparent">
                                                                    {Math.round(editedQuiz.settings.timeLimit.durationSeconds / 60)} phút
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-amber-600/70 font-medium px-1">Đồng hồ sẽ đếm ngược và tự nộp bài khi hết giờ.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Bảo trì & Lockdown</h3>
                                        <div className="space-y-4">
                                            <div className={cn(
                                                "p-5 border rounded-2xl transition-all duration-300",
                                                editedQuiz.settings.lockdown.enabled ? "bg-red-50 border-red-200 shadow-sm" : "bg-slate-50 border-slate-200"
                                            )}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2 rounded-lg", editedQuiz.settings.lockdown.enabled ? "bg-red-500 text-white shadow-md shadow-red-200" : "bg-slate-200 text-slate-500")}>
                                                            <Lock className="w-4 h-4" />
                                                        </div>
                                                        <span className={cn("text-xs font-bold uppercase tracking-tight", editedQuiz.settings.lockdown.enabled ? "text-red-700" : "text-slate-700")}>Lockdown Mode</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                                                        checked={editedQuiz.settings.lockdown.enabled}
                                                        onChange={(e) => updateSettings({
                                                            lockdown: { ...editedQuiz.settings.lockdown, enabled: e.target.checked }
                                                        })}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                                    Khi bật, học sinh sẽ không thể chuyển cửa sổ, thoát khỏi bài thi cho đến khi hoàn thành hoặc hết thời gian.
                                                </p>
                                            </div>

                                            <div className="p-4 bg-slate-50 border rounded-2xl space-y-4">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Nộp bài & Chế độ làm bài</label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <button
                                                            className={cn("w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold transition-all", editedQuiz.settings.submission.mode === 'all_at_once' ? "bg-white border-brand-500 text-brand-700 shadow-sm ring-2 ring-brand-50" : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-300")}
                                                            onClick={() => updateSettings({ submission: { ...editedQuiz.settings.submission, mode: 'all_at_once' } })}
                                                        >
                                                            Toàn bộ sau khi xong (Tiêu chuẩn)
                                                        </button>
                                                        <button
                                                            className={cn("w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold transition-all", editedQuiz.settings.submission.mode === 'per_question' ? "bg-white border-brand-500 text-brand-700 shadow-sm ring-2 ring-brand-50" : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-300")}
                                                            onClick={() => updateSettings({ submission: { ...editedQuiz.settings.submission, mode: 'per_question' } })}
                                                        >
                                                            Nộp ngay sau mỗi câu hỏi
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-slate-200 mx-1" />

                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-brand-600 cursor-pointer"
                                                            checked={editedQuiz.settings.submission.oneAttemptOnly ?? false}
                                                            onChange={(e) => updateSettings({ submission: { ...editedQuiz.settings.submission, oneAttemptOnly: e.target.checked } })}
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 select-none">Chỉ cho phép làm bài 1 lần (Attempt Limit)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-brand-600 cursor-pointer"
                                                            checked={editedQuiz.settings.submission.promptResume ?? true}
                                                            onChange={(e) => updateSettings({ submission: { ...editedQuiz.settings.submission, promptResume: e.target.checked } })}
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 select-none">Hỏi để tiếp tục (Resume functionality)</span>
                                                    </label>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'result' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Nội dung phản hồi sau bài thi</h3>
                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <label className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Thông báo khi ĐẠT VƯỢT CHUẨN</label>
                                            </div>
                                            <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl overflow-hidden shadow-inner-sm">
                                                <RichTextEditor
                                                    content={editedQuiz.result.passMessage}
                                                    onChange={(content) => updateResult({ passMessage: content })}
                                                    placeholder="Chúc mừng, bạn đã đạt !"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                <label className="text-[11px] font-bold text-red-800 uppercase tracking-widest">Thông báo khi KHÔNG ĐẠT</label>
                                            </div>
                                            <div className="bg-red-50/20 border border-red-100 rounded-2xl overflow-hidden shadow-inner-sm">
                                                <RichTextEditor
                                                    content={editedQuiz.result.failMessage}
                                                    onChange={(content) => updateResult({ failMessage: content })}
                                                    placeholder="Bạn chưa đạt, cố gắng hơn nhé !"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Thiết lập hiển thị</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 p-4 bg-slate-50 border rounded-2xl cursor-pointer hover:border-slate-300 transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                                                checked={editedQuiz.result.showStatisticsOnResult}
                                                onChange={(e) => updateResult({ showStatisticsOnResult: e.target.checked })}
                                            />
                                            <span className="text-xs font-bold text-slate-600">Hiển thị thống kê điểm số</span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 mt-4">
                                        <div className="flex flex-col gap-3 p-4 bg-slate-50 border rounded-2xl">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                                                    checked={editedQuiz.result.finishButton.show}
                                                    onChange={(e) => updateResult({
                                                        finishButton: { ...editedQuiz.result.finishButton, show: e.target.checked }
                                                    })}
                                                />
                                                <span className="text-xs font-bold text-slate-600">Kích hoạt nút Hoàn tất & Chuyển hướng</span>
                                            </label>
                                            {editedQuiz.result.finishButton.show && (
                                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">URL khi Đạt</label>
                                                        <input
                                                            type="text"
                                                            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 text-xs outline-none"
                                                            placeholder="https://..."
                                                            value={editedQuiz.result.finishButton.passUrl || ''}
                                                            onChange={(e) => updateResult({
                                                                finishButton: { ...editedQuiz.result.finishButton, passUrl: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">URL khi Không đạt</label>
                                                        <input
                                                            type="text"
                                                            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 text-xs outline-none"
                                                            placeholder="https://..."
                                                            value={editedQuiz.result.finishButton.failUrl || ''}
                                                            onChange={(e) => updateResult({
                                                                finishButton: { ...editedQuiz.result.finishButton, failUrl: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Bảo mật truy cập bài thi</h3>
                                    <div className="grid gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Phương thức bảo vệ</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { id: 'none', label: 'Không bảo mật', sub: 'Bất kỳ ai cũng có thể vào thi' },
                                                    { id: 'password', label: 'Mật khẩu chung', sub: 'Yêu cầu nhập mật khẩu để vào thi' },
                                                    { id: 'user_id_password', label: 'Danh sách học sinh', sub: 'Chỉ các học sinh trong danh sách được phép' },
                                                ].map((mode) => (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => updateSecurity({ protection: mode.id })}
                                                        className={cn(
                                                            "flex flex-col gap-0.5 p-4 rounded-2xl border text-left transition-all",
                                                            editedQuiz.security.protection === mode.id
                                                                ? "bg-brand-50 border-brand-300 ring-2 ring-brand-50"
                                                                : "bg-white border-slate-200 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <span className={cn("text-xs font-bold", editedQuiz.security.protection === mode.id ? "text-brand-700" : "text-slate-700")}>{mode.label}</span>
                                                        <span className="text-[10px] text-slate-400">{mode.sub}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {editedQuiz.security.protection === 'password' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Mật khẩu bài thi</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-1 focus:ring-brand-500 focus:bg-white text-base font-mono font-bold text-slate-800 shadow-inner outline-none transition-all"
                                                        placeholder="Thiết lập mật khẩu..."
                                                        value={editedQuiz.security.password || ''}
                                                        onChange={(e) => updateSecurity({ password: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'questions' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Trộn câu hỏi & Ngẫu nhiên hóa</h3>

                                    <div className="grid gap-3">
                                        {/* Shuffle Questions */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl group hover:border-brand-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                                                    <Component className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Trộn thứ tự câu hỏi</p>
                                                    <p className="text-[10px] text-slate-400">Hiển thị câu hỏi theo thứ tự ngẫu nhiên cho mỗi học sinh</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                    checked={editedQuiz.settings.randomization?.randomizeQuestions || false}
                                                    onChange={(e) => updateSettings({
                                                        randomization: { ...editedQuiz.settings.randomization, randomizeQuestions: e.target.checked }
                                                    })}
                                                />
                                            </div>
                                        </div>

                                        {/* Shuffle Options */}
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl group hover:border-brand-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                                                    <Component className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Trộn thứ tự đáp án</p>
                                                    <p className="text-[10px] text-slate-400">Đảo vị trí các đáp án trong câu trắc nghiệm</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                    checked={editedQuiz.settings.randomization?.randomizeOptions || false}
                                                    onChange={(e) => updateSettings({
                                                        randomization: { ...editedQuiz.settings.randomization, randomizeOptions: e.target.checked }
                                                    })}
                                                />
                                            </div>
                                        </div>

                                        {/* Randomize N count */}
                                        <div className={cn(
                                            "flex flex-col gap-4 p-4 border rounded-2xl transition-all duration-300",
                                            editedQuiz.settings.randomization?.randomCount && editedQuiz.settings.randomization.randomCount > 0 ? "bg-amber-50/30 border-amber-200 shadow-sm" : "bg-slate-50 border-slate-200"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2.5 rounded-xl border shadow-sm transition-colors", editedQuiz.settings.randomization?.randomCount && editedQuiz.settings.randomization.randomCount > 0 ? "bg-amber-50 text-amber-500 border-amber-200" : "bg-white border-slate-200 text-slate-400")}>
                                                        <Component className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">Chỉ chọn ngẫu nhiên N câu hỏi</p>
                                                        <p className="text-[10px] text-slate-400">Rút ngẫu nhiên một số lượng câu hỏi từ bộ đề</p>
                                                    </div>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                                                        checked={!!(editedQuiz.settings.randomization?.randomCount && editedQuiz.settings.randomization.randomCount > 0)}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked;
                                                            updateSettings({
                                                                randomization: {
                                                                    ...editedQuiz.settings.randomization,
                                                                    randomCount: isChecked ? 10 : 0
                                                                }
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {!!(editedQuiz.settings.randomization?.randomCount && editedQuiz.settings.randomization.randomCount > 0) && (
                                                <div className="flex items-center gap-3 ml-[52px] animate-in fade-in zoom-in-95 duration-200">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Số lượng câu hỏi hiển thị:</label>
                                                    <input
                                                        type="number"
                                                        className="w-24 h-9 px-3 bg-white border border-amber-200 rounded-lg text-sm font-bold text-slate-700 shadow-inner outline-none focus:ring-1 focus:ring-amber-500"
                                                        value={editedQuiz.settings.randomization.randomCount ?? 0}
                                                        min={1}
                                                        max={editedQuiz.questions ? editedQuiz.questions.length : 100}
                                                        onChange={(e) => updateSettings({
                                                            randomization: { ...editedQuiz.settings.randomization, randomCount: parseInt(e.target.value) || 0 }
                                                        })}
                                                    />
                                                    <span className="text-[10px] font-medium text-slate-400">/ {editedQuiz.questions?.length || 0} tổng số</span>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'other' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2">Thông báo qua Email</h3>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-2xl cursor-pointer hover:border-slate-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Gửi kết quả cho học sinh</p>
                                                    <p className="text-[10px] text-slate-400">Yêu cầu thu thập email trong phần Thông tin Quiz</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                checked={editedQuiz.settings.email?.sendResultsToUser || false}
                                                onChange={(e) => updateSettings({ email: { ...editedQuiz.settings.email, sendResultsToUser: e.target.checked } })}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 p-4 bg-slate-50 border rounded-2xl">
                                            <div className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400">
                                                        <Mail className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">Thông báo cho Giáo viên/Admin</p>
                                                        <p className="text-[10px] text-slate-400">Nhận email mỗi khi có người nộp bài</p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                    checked={editedQuiz.settings.email?.sendResultsToAdmin || false}
                                                    onChange={(e) => updateSettings({ email: { ...editedQuiz.settings.email, sendResultsToAdmin: e.target.checked } })}
                                                />
                                            </div>

                                            {editedQuiz.settings.email?.sendResultsToAdmin && (
                                                <div className="pl-14 pt-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1 mb-1">Email nhận thông báo</label>
                                                    <input
                                                        type="email"
                                                        className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 text-sm outline-none"
                                                        placeholder="admin@school.com"
                                                        value={editedQuiz.settings.email?.adminEmail || ''}
                                                        onChange={(e) => updateSettings({ email: { ...editedQuiz.settings.email, adminEmail: e.target.value } })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        Siêu dữ liệu (SEO / Meta tags)
                                    </h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Meta Title</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 text-sm outline-none"
                                                placeholder="Tiêu đề hiển thị trên trình duyệt / Google"
                                                value={editedQuiz.settings.meta?.title || ''}
                                                onChange={(e) => updateSettings({ meta: { ...editedQuiz.settings.meta, title: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Meta Description</label>
                                            <textarea
                                                className="w-full h-20 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 text-sm outline-none resize-none"
                                                placeholder="Mô tả dùng cho các công cụ tìm kiếm hoặc trang chia sẻ"
                                                value={editedQuiz.settings.meta?.description || ''}
                                                onChange={(e) => updateSettings({ meta: { ...editedQuiz.settings.meta, description: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-5 border-t bg-slate-50 flex items-center justify-between flex-shrink-0">
                    <div className="flex flex-col">
                        <p className="text-[10px] text-slate-400 font-mono italic">Quiz ID: {editedQuiz.id.toUpperCase()}</p>
                        <p className="text-[9px] text-slate-300 font-medium">Cấu hình sẽ được áp dụng ngay khi lưu.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Đóng</Button>
                        <Button variant="default" size="sm" onClick={handleSave} className="px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-brand-500/20 active:scale-95 transition-all">Lưu cấu hình</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}
