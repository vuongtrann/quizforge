import { usePlayerStore } from '../store/playerStore'
import { ShieldAlert, Lock } from 'lucide-react'

export function LockdownOverlay() {
    const { feedbackVisible, setLockdownWarning, violationCount } = usePlayerStore()

    if (!feedbackVisible) return null

    return (
        <div className="fixed inset-0 z-[100] bg-brand-900/90 backdrop-blur-xl flex items-center justify-center p-6 text-white text-center">
            <div className="max-w-md space-y-8 animate-in zoom-in-95 duration-300">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 rounded-full blur-3xl opacity-20 animate-pulse" />
                    <ShieldAlert className="w-24 h-24 text-amber-500 mx-auto relative z-10" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">VI PHẠM BẢO MẬT!</h2>
                    <p className="text-brand-200 text-lg font-medium leading-relaxed">
                        Bạn vừa rời khỏi cửa sổ bài thi. Hành động này đã được ghi lại và gửi đến giáo viên.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-4">
                    <div className="flex items-center gap-3 justify-center text-amber-400">
                        <Lock className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Thiết bị đã bị khóa</span>
                    </div>
                    <button
                        onClick={() => setLockdownWarning(false)}
                        className="w-full h-14 bg-white text-brand-900 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-50 transition-all active:scale-95"
                    >
                        Quay lại bài thi
                    </button>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        Lần vi phạm: {String(violationCount).padStart(2, '0')}
                    </p>
                </div>
            </div>
        </div>
    )
}
