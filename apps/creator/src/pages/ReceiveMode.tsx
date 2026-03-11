import { Radio, ShieldCheck, Wifi, Activity, ArrowLeft } from "lucide-react"
import { Link } from "@tanstack/react-router"

export function ReceiveMode() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center relative" style={{ background: '#0c0c0e' }}>
            {/* Back */}
            <div className="absolute top-6 left-6">
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all"
                    style={{ borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                    <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                </Link>
            </div>

            <div className="w-full max-w-lg space-y-10">
                {/* Icon */}
                <div className="w-24 h-24 flex items-center justify-center mx-auto"
                    style={{ borderRadius: 'var(--r-2xl)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Radio className="w-10 h-10 text-white animate-pulse" />
                </div>

                {/* Status */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 px-4 py-1.5 w-fit mx-auto"
                        style={{ borderRadius: 'var(--r-full)', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.1)' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-medium text-emerald-400">Đang lắng nghe</span>
                    </div>
                    <h1 className="text-3xl font-semibold text-white">Chế độ nhận bài</h1>
                    <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: '#666' }}>
                        Yêu cầu thí sinh nhập mã máy chủ hoặc quét QR để nộp bài qua mạng nội bộ.
                    </p>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 space-y-2"
                        style={{ borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Wifi className="w-4 h-4 mx-auto" style={{ color: '#666' }} />
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#666' }}>Địa chỉ IP</p>
                        <p className="text-lg font-semibold text-white font-mono">192.168.1.105</p>
                    </div>
                    <div className="p-5 space-y-2"
                        style={{ borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <ShieldCheck className="w-4 h-4 mx-auto" style={{ color: '#666' }} />
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#666' }}>Cổng (Port)</p>
                        <p className="text-lg font-semibold text-white font-mono">41235</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4 pt-4">
                    <button className="h-10 px-8 text-sm font-medium active:scale-[0.98] transition-all"
                        style={{ borderRadius: 'var(--r-md)', background: 'white', color: '#0c0c0e' }}>
                        Dừng lắng nghe
                    </button>
                    <p className="text-xs flex items-center justify-center gap-2" style={{ color: '#666' }}>
                        <Activity className="w-3 h-3" /> Theo dõi thời gian thực tại Dashboard
                    </p>
                </div>
            </div>
        </div>
    )
}
