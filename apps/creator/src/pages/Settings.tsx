import { useState, useEffect } from "react"
import {
    Settings as SettingsIcon,
    Database,
    Network,
    RefreshCw,
    Sun,
    Star,
    Shield,
    Save,
    RotateCcw,
    ArrowLeft,
    CheckCircle,
    Download,
    Loader2,
    AlertCircle,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"
import { Link } from "@tanstack/react-router"
import { invoke } from "@tauri-apps/api/core"

interface AppSettings {
    result_server_url: string
    lan_receive_port: number
    heartbeat_port: number
    auto_update_enabled: boolean
    theme: string
    language: string
    default_passing_rate: number
    default_points_correct: number
    default_points_incorrect: number
    default_feedback_correct: string
    default_feedback_incorrect: string
    media_max_size_mb: number
    branding_org_name: string
    branding_website: string
    branding_app_name: string
    branding_bg_color: string
}

const DEFAULT_SETTINGS: AppSettings = {
    result_server_url: "",
    lan_receive_port: 41235,
    heartbeat_port: 41236,
    auto_update_enabled: true,
    theme: "light",
    language: "vi",
    default_passing_rate: 95,
    default_points_correct: 10,
    default_points_incorrect: 0,
    default_feedback_correct: "Chính xác !",
    default_feedback_incorrect: "Không chính xác !",
    media_max_size_mb: 50,
    branding_org_name: "",
    branding_website: "",
    branding_app_name: "QuizForge Creator",
    branding_bg_color: "#eff6ff",
}

interface UpdateInfoData {
    version: string
    body: string | null
    date: string | null
}

function UpdateChecker() {
    const [checking, setChecking] = useState(false)
    const [installing, setInstalling] = useState(false)
    const [updateInfo, setUpdateInfo] = useState<UpdateInfoData | null>(null)
    const [checkResult, setCheckResult] = useState<'none' | 'available' | 'error' | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    const handleCheck = async () => {
        setChecking(true)
        setCheckResult(null)
        setErrorMsg('')
        try {
            const result = await invoke<UpdateInfoData | null>('check_for_updates')
            if (result) {
                setUpdateInfo(result)
                setCheckResult('available')
            } else {
                setCheckResult('none')
            }
        } catch (e) {
            setCheckResult('error')
            setErrorMsg(String(e))
        } finally {
            setChecking(false)
        }
    }

    const handleInstall = async () => {
        setInstalling(true)
        try {
            await invoke('install_update')
        } catch (e) {
            setErrorMsg(String(e))
            setCheckResult('error')
        } finally {
            setInstalling(false)
        }
    }

    const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.1.0'

    return (
        <div className="p-5 space-y-4" style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Phiên bản hiện tại</h3>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>v{appVersion}</p>
                </div>
                <button
                    onClick={handleCheck}
                    disabled={checking}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)' }}
                >
                    {checking
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra...</>
                        : <><RefreshCw className="w-3.5 h-3.5" /> Kiểm tra cập nhật</>
                    }
                </button>
            </div>

            {checkResult === 'none' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-700 font-medium">Bạn đang dùng phiên bản mới nhất!</span>
                </div>
            )}

            {checkResult === 'available' && updateInfo && (
                <div className="p-3 rounded-lg space-y-3" style={{ background: 'var(--accent-subtle)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                                Phiên bản mới: v{updateInfo.version}
                            </span>
                            {updateInfo.date && (
                                <span className="text-[10px] ml-2" style={{ color: 'var(--text-tertiary)' }}>
                                    {updateInfo.date}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleInstall}
                            disabled={installing}
                            className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-medium text-white rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                            style={{ background: 'var(--accent)' }}
                        >
                            {installing
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang cài đặt...</>
                                : <><Download className="w-3.5 h-3.5" /> Cập nhật ngay</>
                            }
                        </button>
                    </div>
                    {updateInfo.body && (
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {updateInfo.body}
                        </p>
                    )}
                </div>
            )}

            {checkResult === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs text-red-600">{errorMsg || 'Không thể kiểm tra cập nhật.'}</span>
                </div>
            )}
        </div>
    )
}

export function Settings() {
    const [activeTab, setActiveTab] = useState<'general' | 'network' | 'defaults'>('general')
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
    const [isSaving, setIsSaving] = useState(false)
    const [savedFlash, setSavedFlash] = useState(false)

    useEffect(() => {
        invoke<AppSettings>('get_settings')
            .then(s => setSettings(s))
            .catch(console.error)
    }, [])

    const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await invoke('save_settings', { settings })
            setSavedFlash(true)
            setTimeout(() => setSavedFlash(false), 2000)
        } catch (e) {
            console.error('Failed to save settings:', e)
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS)
    }

    return (
        <div className="h-full flex flex-col" style={{ background: 'var(--bg-card)' }}>
            {/* Header */}
            <div className="px-8 py-5 relative" style={{ borderBottom: '1px solid var(--border)' }}>
                <Link to="/dashboard" className="absolute top-5 right-8 flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)' }}>
                    <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
                        <SettingsIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Thiết lập hệ thống</h1>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Cấu hình tham số mặc định và kết nối</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-56 p-4 space-y-1" style={{ borderRight: '1px solid var(--border)' }}>
                    {([
                        { id: 'general', icon: SettingsIcon, label: 'Cài đặt chung' },
                        { id: 'network', icon: Network, label: 'Kết nối & Máy chủ' },
                        { id: 'defaults', icon: Star, label: 'Giá trị mặc định' },
                    ] as const).map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all",
                                activeTab === id ? "font-medium" : ""
                            )}
                            style={{
                                borderRadius: 'var(--r-md)',
                                color: activeTab === id ? 'var(--accent-text)' : 'var(--text-secondary)',
                                background: activeTab === id ? 'var(--accent-subtle)' : 'transparent',
                            }}
                        >
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--bg-app)' }}>
                    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div className="p-6 space-y-6" style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Giao diện (Theme)</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Thay đổi màu sắc chủ đạo của Creator.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="gap-2 font-semibold text-xs h-8" style={{ borderRadius: 'var(--r-md)', background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--border)' }}>
                                                <Sun className="w-3.5 h-3.5" /> Sáng (Light)
                                            </Button>
                                            <Button variant="ghost" size="sm" disabled className="gap-2 font-semibold text-xs h-8 opacity-40" style={{ borderRadius: 'var(--r-md)' }}>
                                                <Shield className="w-3.5 h-3.5" /> Tối (Soon)
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="h-px" style={{ background: 'var(--border)' }} />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ngôn ngữ</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Lựa chọn ngôn ngữ hiển thị giao diện.</p>
                                        </div>
                                        <select
                                            className="px-3 py-1.5 text-xs font-medium outline-none"
                                            style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border-control)', background: 'var(--bg-control)', color: 'var(--text-primary)' }}
                                            value={settings.language}
                                            onChange={e => update('language', e.target.value)}
                                        >
                                            <option value="vi">Tiếng Việt (Việt Nam)</option>
                                            <option value="en" disabled>English (US) - Soon</option>
                                        </select>
                                    </div>

                                    <div className="h-px" style={{ background: 'var(--border)' }} />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tự động cập nhật</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Luôn giữ phiên bản ứng dụng mới nhất.</p>
                                        </div>
                                        <button
                                            onClick={() => update('auto_update_enabled', !settings.auto_update_enabled)}
                                            className="w-11 h-6 rounded-full relative flex items-center px-0.5 transition-colors"
                                            style={{ background: settings.auto_update_enabled ? 'var(--accent)' : 'var(--border-strong)' }}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                                                settings.auto_update_enabled ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                {/* Update check card */}
                                <UpdateChecker />
                            </div>
                        )}

                        {activeTab === 'network' && (
                            <div className="space-y-4">
                                <div className="p-6 space-y-5" style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            <Database className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Cấu hình máy chủ kết quả
                                        </h3>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>HTTP Result Server URL</label>
                                            <input
                                                type="text"
                                                className="w-full h-9 px-3 text-sm font-mono outline-none transition-all"
                                                style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border-control)', borderBottom: '1px solid var(--border-control-b)', background: 'var(--bg-control)', color: 'var(--accent)' }}
                                                placeholder="https://your-api.com/results"
                                                value={settings.result_server_url}
                                                onChange={e => update('result_server_url', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>LAN Receiver Port</label>
                                            <input
                                                type="number"
                                                className="w-full h-9 px-3 text-sm font-bold outline-none"
                                                style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border-control)', borderBottom: '1px solid var(--border-control-b)', background: 'var(--bg-control)', color: 'var(--text-primary)' }}
                                                value={settings.lan_receive_port}
                                                onChange={e => update('lan_receive_port', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Heartbeat Port</label>
                                            <input
                                                type="number"
                                                className="w-full h-9 px-3 text-sm font-bold outline-none"
                                                style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border-control)', borderBottom: '1px solid var(--border-control-b)', background: 'var(--bg-control)', color: 'var(--text-primary)' }}
                                                value={settings.heartbeat_port}
                                                onChange={e => update('heartbeat_port', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-[var(--r-lg)] flex gap-3 bg-amber-50 border border-amber-100">
                                    <RefreshCw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-amber-900">Thông tin cổng mạng</h4>
                                        <p className="text-xs text-amber-700/70 mt-1 leading-relaxed">Vui lòng đảm bảo các cổng này không bị chặn bởi Tường lửa (Firewall) của Windows để có thể nhận kết quả từ mạng nội bộ.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'defaults' && (
                            <div className="space-y-4">
                                <div className="p-6 space-y-5" style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Tỷ lệ đậu mặc định (%)</label>
                                            <input
                                                type="number"
                                                className="w-full h-9 px-3 text-sm font-bold outline-none"
                                                style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border-control)', borderBottom: '1px solid var(--border-control-b)', background: 'var(--bg-control)', color: 'var(--text-primary)' }}
                                                value={settings.default_passing_rate}
                                                onChange={e => update('default_passing_rate', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Điểm mặc định / câu</label>
                                            <input
                                                type="number"
                                                className="w-full h-9 px-3 text-sm font-bold outline-none"
                                                style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border-control)', borderBottom: '1px solid var(--border-control-b)', background: 'var(--bg-control)', color: 'var(--text-primary)' }}
                                                value={settings.default_points_correct}
                                                onChange={e => update('default_points_correct', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Kích thước Media tối đa (MB)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                className="flex-1"
                                                style={{ accentColor: 'var(--accent)' }}
                                                min="5"
                                                max="100"
                                                value={settings.media_max_size_mb}
                                                onChange={e => update('media_max_size_mb', Number(e.target.value))}
                                            />
                                            <span className="text-xs font-bold w-12 text-right" style={{ color: 'var(--text-primary)' }}>{settings.media_max_size_mb}MB</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Thông báo mặc định (Vượt qua)</label>
                                        <textarea
                                            className="w-full h-24 p-3 text-xs font-medium outline-none"
                                            style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border-control)', background: 'var(--bg-control)', color: 'var(--text-primary)' }}
                                            value={settings.default_feedback_correct}
                                            onChange={e => update('default_feedback_correct', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={cn(
                                    "h-9 px-6 font-semibold text-sm gap-2 transition-all active:scale-95",
                                    savedFlash ? "bg-green-600 text-white" : ""
                                )}
                                style={savedFlash ? {} : { borderRadius: 'var(--r-md)' }}
                            >
                                {savedFlash ? (
                                    <><CheckCircle className="w-4 h-4" /> Đã lưu!</>
                                ) : (
                                    <><Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                className="h-9 px-5 font-semibold text-sm gap-2"
                                style={{ borderRadius: 'var(--r-md)', color: 'var(--text-tertiary)' }}
                            >
                                <RotateCcw className="w-4 h-4" /> Khôi phục
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
