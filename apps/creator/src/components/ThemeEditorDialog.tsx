import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
    Palette,
    Layout,
    Play,
    Smartphone,
    Monitor,
    Maximize2,
    Clock
} from "lucide-react"
import { cn } from "../lib/utils"
import { Quiz, Theme, type NavigationStyle, type ProgressStyle } from "@quizforge/types"

interface ThemeEditorDialogProps {
    quiz: Quiz
    isOpen: boolean
    onClose: () => void
    onSave: (theme: Theme) => void
}

type TabType = 'template' | 'layout'

export function ThemeEditorDialog({ quiz, isOpen, onClose, onSave }: ThemeEditorDialogProps) {
    const [activeTab, setActiveTab] = useState<TabType>('template')
    const [theme, setTheme] = useState<Theme | null>(null)

    useEffect(() => {
        if (quiz && quiz.theme && isOpen) {
            setTheme(JSON.parse(JSON.stringify(quiz.theme)))
        }
    }, [quiz, isOpen])

    if (!theme) return null

    const handleSave = () => {
        onSave(theme)
        onClose()
    }

    const updateTheme = (fields: Partial<Theme>) => {
        setTheme({ ...theme, ...fields } as Theme)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[1100px] w-full h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-slate-900 text-white flex-shrink-0 flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Palette className="w-5 h-5 text-brand-400" />
                        Giao diện người chơi (Player Template)
                    </DialogTitle>
                    <div className="flex bg-slate-800 rounded-lg p-1 mr-4">
                        <button className="p-1 px-2 rounded-md bg-slate-700 text-white text-[10px] font-bold uppercase transition-all">Desktop</button>
                        <button className="p-1 px-2 rounded-md text-slate-400 text-[10px] font-bold uppercase hover:text-white transition-all">Mobile</button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden bg-slate-100">
                    <div className="w-[320px] bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('template')}
                                className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all", activeTab === 'template' ? "border-b-2 border-brand-500 text-brand-600 bg-brand-50/10" : "text-slate-400 hover:text-slate-600")}
                            >
                                <Palette className="w-3.5 h-3.5 mx-auto mb-1" />
                                Template
                            </button>
                            <button
                                onClick={() => setActiveTab('layout')}
                                className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all", activeTab === 'layout' ? "border-b-2 border-brand-500 text-brand-600 bg-brand-50/10" : "text-slate-400 hover:text-slate-600")}
                            >
                                <Layout className="w-3.5 h-3.5 mx-auto mb-1" />
                                Layout
                            </button>
                        </div>

                        <div className="p-6 space-y-8 flex-1">
                            {activeTab === 'template' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Màu sắc chủ đạo</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Màu nhấn</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-none outline-none"
                                                        value={theme.primaryColor}
                                                        onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                                    />
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase">{theme.primaryColor}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Màu nền</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-none outline-none"
                                                        value={theme.backgroundColor}
                                                        onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                                                    />
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase">{theme.backgroundColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Font chữ & Kiểu dáng</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Bộ font</span>
                                                <select
                                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-brand-500"
                                                    value={theme.fontFamily}
                                                    onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                                                >
                                                    <option value="Be Vietnam Pro">Be Vietnam Pro</option>
                                                    <option value="Inter">Inter</option>
                                                    <option value="Roboto">Roboto</option>
                                                    <option value="Outfit">Outfit</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Tùy chọn hiển thị</h4>
                                        <div className="space-y-2">
                                            <label className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl hover:border-slate-300 cursor-pointer">
                                                <div className="text-xs font-bold text-slate-600">Bo góc ảnh/ô</div>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                                                    checked={theme.roundedCorners}
                                                    onChange={(e) => updateTheme({ roundedCorners: e.target.checked })}
                                                />
                                            </label>
                                            <label className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl hover:border-slate-300 cursor-pointer">
                                                <div className="text-xs font-bold text-slate-600">Đồng hồ đếm ngược</div>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                                                    checked={theme.showTimer}
                                                    onChange={(e) => updateTheme({ showTimer: e.target.checked })}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'layout' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Kiểu điều hướng (Nav)</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['buttons', 'sidebar', 'floating'].map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() => updateTheme({ navigationStyle: style as NavigationStyle })}
                                                    className={cn(
                                                        "w-full text-left p-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-tighter",
                                                        theme.navigationStyle === style
                                                            ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm"
                                                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white"
                                                    )}
                                                >
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Tiến trình (Progress)</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['bar', 'dots', 'number'].map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() => updateTheme({ progressStyle: style as ProgressStyle })}
                                                    className={cn(
                                                        "w-full text-left p-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-tighter",
                                                        theme.progressStyle === style
                                                            ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm"
                                                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white"
                                                    )}
                                                >
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-8 flex items-center justify-center relative bg-slate-100 overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${theme.primaryColor}, transparent)` }} />
                        <div className="w-full max-w-[700px] h-full max-h-[500px] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col transition-all duration-300" style={{ backgroundColor: theme.backgroundColor }}>
                            <header className="h-14 flex items-center justify-between px-6 border-b transition-all bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: theme.primaryColor }}>
                                        <Play className="w-4 h-4 ml-0.5" />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-800">{quiz.information.title}</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    {theme.showTimer && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                                            <Clock className="w-3 h-3" /> 00:59:59
                                        </div>
                                    )}
                                    <button className="p-1.5 text-slate-300"><Maximize2 className="w-4 h-4" /></button>
                                </div>
                            </header>

                            <div className="px-6 py-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Câu hỏi 1/10</span>
                                    <span className="text-[10px] font-bold" style={{ color: theme.primaryColor }}>10% hoàn thành</span>
                                </div>
                                {theme.progressStyle === 'bar' && (
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-500 transition-all w-1/10" style={{ backgroundColor: theme.primaryColor, width: '10%' }} />
                                    </div>
                                )}
                                {theme.progressStyle === 'dots' && (
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                            <div key={i} className={cn("w-2 h-2 rounded-full", i === 1 ? "bg-brand-500" : "bg-slate-200")} style={{ backgroundColor: i === 1 ? theme.primaryColor : undefined }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-bold text-slate-800 leading-relaxed mb-8">Thủ đô của Việt Nam?</h3>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {['Hà Nội', 'TP.HCM'].map((opt, i) => (
                                        <div
                                            key={i}
                                            className={cn("p-4 border-2 rounded-2xl text-sm font-bold", i === 0 ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-100 bg-white text-slate-400")}
                                            style={{
                                                borderRadius: theme.roundedCorners ? '1rem' : '0.25rem',
                                                borderColor: i === 0 ? theme.primaryColor : undefined,
                                                backgroundColor: i === 0 ? `${theme.primaryColor}10` : undefined,
                                                color: i === 0 ? theme.primaryColor : undefined,
                                            }}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <footer className="h-20 flex items-center justify-between px-8 bg-white border-t">
                                {theme.navigationStyle === 'buttons' && (
                                    <>
                                        <Button variant="outline" size="sm" className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-8 py-5 opacity-30">Quay lại</Button>
                                        <Button variant="default" size="sm" className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-10 py-5 shadow-lg shadow-brand-500/20" style={{ backgroundColor: theme.primaryColor }}>Tiếp tục</Button>
                                    </>
                                )}
                            </footer>
                        </div>

                        <div className="absolute right-6 bottom-6 flex flex-col gap-2">
                            <button className="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-brand-600 border border-slate-100 transition-all"><Monitor className="w-4 h-4" /></button>
                            <button className="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-400 border border-slate-100 transition-all"><Smartphone className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-white flex items-center justify-end flex-shrink-0 gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Đóng</Button>
                    <Button variant="default" size="sm" onClick={handleSave} className="px-10 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-brand-500/20 active:scale-95 transition-all">Lưu giao diện</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
