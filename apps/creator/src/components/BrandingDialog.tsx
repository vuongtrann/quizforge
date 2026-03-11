import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
    ShieldCheck,
    Image as ImageIcon,
    Link2,
    Trash2,
    Crown,
    CheckCircle2,
    Palette,
    Building2,
    Monitor,
    Globe,
    RotateCcw
} from "lucide-react"
import { cn } from "../lib/utils"
import { type QuizInformation } from "@quizforge/types"
import { open } from "@tauri-apps/plugin-dialog"
import { readFile } from "@tauri-apps/plugin-fs"

type BrandingData = NonNullable<QuizInformation['branding']>

interface BrandingDialogProps {
    isOpen: boolean
    onClose: () => void
    branding?: BrandingData
    onSave: (branding: BrandingData) => void
}

export function BrandingDialog({ isOpen, onClose, branding, onSave }: BrandingDialogProps) {
    const [logo, setLogo] = useState<string | null>(branding?.logo || null)
    const [footerText, setFooterText] = useState(branding?.footerText || "Powered by QuizForce Professional")
    const [removeBranding, setRemoveBranding] = useState(branding?.removeBranding || false)
    const [customDomain, setCustomDomain] = useState(branding?.customDomain || "")

    const [backgroundMode, setBackgroundMode] = useState<'color' | 'gradient' | 'image'>(branding?.backgroundMode || 'color')
    const [backgroundColor, setBackgroundColor] = useState(branding?.backgroundColor || '#f8fafc')
    const [backgroundGradient, setBackgroundGradient] = useState(branding?.backgroundGradient || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)')
    const [backgroundImage, setBackgroundImage] = useState<string | null>(branding?.backgroundImage || null)

    const [orgName, setOrgName] = useState(branding?.orgName || "")
    const [orgWebsite, setOrgWebsite] = useState(branding?.orgWebsite || "")

    useEffect(() => {
        if (isOpen && branding) {
            setLogo(branding.logo || null)
            setFooterText(branding.footerText || "Powered by QuizForce Professional")
            setRemoveBranding(branding.removeBranding || false)
            setCustomDomain(branding.customDomain || "")
            setBackgroundMode(branding.backgroundMode || 'color')
            setBackgroundColor(branding.backgroundColor || '#f8fafc')
            setBackgroundGradient(branding.backgroundGradient || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)')
            setBackgroundImage(branding.backgroundImage || null)
            setOrgName(branding.orgName || "")
            setOrgWebsite(branding.orgWebsite || "")
        }
    }, [isOpen, branding])

    const handleSave = () => {
        onSave({
            logo,
            footerText,
            removeBranding,
            customDomain,
            backgroundMode,
            backgroundColor,
            backgroundGradient,
            backgroundImage,
            orgName,
            orgWebsite
        })
        onClose()
    }

    const resetDefaults = () => {
        setLogo(null)
        setFooterText("Powered by QuizForce Professional")
        setRemoveBranding(false)
        setCustomDomain("")
        setBackgroundMode('color')
        setBackgroundColor('#f8fafc')
        setOrgName("")
        setOrgWebsite("")
        setBackgroundImage(null)
    }

    const handleUploadLogo = async () => {
        const selected = await open({
            multiple: false,
            filters: [{ name: 'Images', extensions: ['png', 'webp', 'jpg', 'jpeg'] }]
        })
        if (selected && typeof selected === 'string') {
            const data = await readFile(selected)
            const ext = selected.split('.').pop()?.toLowerCase() || 'png'
            const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
            const b64 = btoa(String.fromCharCode(...data))
            setLogo(`data:${mime};base64,${b64}`)
        }
    }

    const handleUploadBgImage = async () => {
        const selected = await open({
            multiple: false,
            filters: [{ name: 'Images', extensions: ['png', 'webp', 'jpg', 'jpeg'] }]
        })
        if (selected && typeof selected === 'string') {
            const data = await readFile(selected)
            const ext = selected.split('.').pop()?.toLowerCase() || 'png'
            const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
            const b64 = btoa(String.fromCharCode(...data))
            setBackgroundImage(`data:${mime};base64,${b64}`)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[900px] w-full p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
                <DialogHeader className="px-8 py-6 bg-slate-50 border-b flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Palette className="w-6 h-6 text-brand-600" />
                        Thiết lập thương hiệu
                    </DialogTitle>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={resetDefaults} className="h-8 text-[10px] font-bold text-slate-400 hover:text-slate-600 gap-1.5 uppercase tracking-widest">
                            <RotateCcw className="w-3 h-3" /> Mặc định
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                            <Crown className="w-3 h-3 text-amber-600 fill-current" />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tighter">Premium</span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-row h-[600px]">
                    {/* Settings Panel */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white border-r">
                        {/* Section: Organization */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" /> Thông tin tổ chức
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Tên tổ chức</label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="Công ty/Trường học..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Website</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                        <input
                                            type="text"
                                            value={orgWebsite}
                                            onChange={(e) => setOrgWebsite(e.target.value)}
                                            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="your-website.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Logo */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="w-3.5 h-3.5" /> Logo thương hiệu
                                </h4>
                                {logo && (
                                    <Button variant="ghost" size="sm" onClick={() => setLogo(null)} className="h-6 text-[10px] text-red-500 hover:bg-red-50 gap-1.5">
                                        <Trash2 className="w-3 h-3" /> Gỡ bỏ
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-4 items-center">
                                <div
                                    onClick={handleUploadLogo}
                                    className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-slate-100/50 transition-all shadow-sm"
                                >
                                    {logo ? (
                                        <img src={logo} className="w-full h-full object-contain p-2" alt="Logo preview" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <p className="text-xs font-bold text-slate-700">Tải lên Logo (PNG/WEBP nền trong)</p>
                                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Sẽ hiển thị tại Header và trang giới thiệu.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section: Background */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5" /> Giao diện nền (Welcome Screen)
                            </h4>
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                {(['color', 'gradient', 'image'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setBackgroundMode(mode)}
                                        className={cn(
                                            "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            backgroundMode === mode ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        {mode === 'color' ? 'Màu đơn' : mode === 'gradient' ? 'Gradients' : 'Hình ảnh'}
                                    </button>
                                ))}
                            </div>

                            {backgroundMode === 'color' && (
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="w-12 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
                                    />
                                </div>
                            )}

                            {backgroundMode === 'gradient' && (
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                        'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
                                        'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)'
                                    ].map(grad => (
                                        <button
                                            key={grad}
                                            onClick={() => setBackgroundGradient(grad)}
                                            style={{ background: grad }}
                                            className={cn("h-10 rounded-lg border-2", backgroundGradient === grad ? "border-brand-500 scale-105" : "border-white shadow-sm")}
                                        />
                                    ))}
                                </div>
                            )}

                            {backgroundMode === 'image' && (
                                <div
                                    onClick={handleUploadBgImage}
                                    className="h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-100/50 transition-colors relative overflow-hidden"
                                >
                                    {backgroundImage ? (
                                        <>
                                            <img src={backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                                            <span className="relative z-10 text-[9px] font-bold uppercase text-slate-600 bg-white/80 px-2 py-1 rounded">Nhấn để đổi ảnh nền</span>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-6 h-6 mb-1" />
                                            <span className="text-[9px] font-bold uppercase">Nhấn để tải ảnh nền</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Premium Features */}
                        <div className="p-6 bg-slate-900 rounded-3xl space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Loại bỏ nhãn bản quyền
                                    </h5>
                                    <p className="text-[9px] text-slate-400">Ẩn chữ "Powered by QuizForce" tại chân trang.</p>
                                </div>
                                <button
                                    onClick={() => setRemoveBranding(!removeBranding)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                                        removeBranding ? "bg-amber-500" : "bg-slate-700"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 bg-white rounded-full shadow-md transition-all",
                                        removeBranding ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </button>
                            </div>
                            <div className="space-y-2 pt-6 border-t border-slate-800">
                                <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Tên miền tùy chỉnh</h5>
                                <div className="relative">
                                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        placeholder="quiz.yourdomain.com"
                                        className="w-full h-10 pl-10 pr-4 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-amber-100 placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview Panel */}
                    <div className="w-[360px] bg-slate-100 p-8 flex flex-col">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Xem trước thực tế (Mini)</h4>

                        <div className="flex-1 bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col border border-white">
                            {/* Simulator Window */}
                            <div className="h-4 bg-slate-200 flex items-center px-3 gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            </div>

                            <div className="flex-1 relative flex flex-col items-center justify-center p-6 text-center"
                                style={{
                                    background: backgroundMode === 'color' ? backgroundColor : backgroundMode === 'gradient' ? backgroundGradient : '#f1f5f9'
                                }}
                            >
                                {backgroundMode === 'image' && backgroundImage && (
                                    <img src={backgroundImage} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                )}
                                <div className="relative z-10 space-y-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto border border-slate-50">
                                        {logo ? <img src={logo} className="w-10 h-10 object-contain" alt="" /> : <Palette className="w-8 h-8 text-slate-100" />}
                                    </div>
                                    <div className="space-y-1">
                                        <h6 className="text-sm font-black text-slate-800 uppercase leading-none">Smart Quiz 2024</h6>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{orgName || 'Tên tổ chức'}</p>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm h-8 w-24 rounded-lg mx-auto border border-white flex items-center justify-center">
                                        <span className="text-[8px] font-black text-brand-600 uppercase">Bắt đầu</span>
                                    </div>
                                </div>

                                {/* Mini Footer */}
                                <div className="absolute bottom-4 left-0 right-0 px-4 text-[6px] font-bold text-slate-400 flex items-center justify-between">
                                    <span className="truncate max-w-[100px]">{footerText}</span>
                                    {!removeBranding && <span className="opacity-50">BY QUIZFORCE</span>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                                <p className="text-[9px] text-amber-800 font-medium leading-tight">Cấu hình này sẽ được áp dụng cho trang giới thiệu bài thi.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-6">Hủy bỏ</Button>
                    <Button
                        onClick={handleSave}
                        className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-10 bg-slate-900 text-white shadow-xl active:scale-95 transition-all"
                    >
                        Lưu thiết lập
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
