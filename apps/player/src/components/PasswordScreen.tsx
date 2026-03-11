import { useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { Lock, ArrowRight, AlertCircle } from 'lucide-react'

export function PasswordScreen() {
    const { quiz, setPhase } = usePlayerStore()
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === quiz?.security?.password) {
            // Password correct! Move to next phase
            if (quiz?.information?.introduction?.enabled) {
                setPhase('details')
            } else {
                setPhase('intro')
            }
        } else {
            setError('Mật khẩu không chính xác')
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 space-y-8">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-brand-100">
                            <Lock className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vui lòng nhập mật khẩu</h2>
                            <p className="text-sm text-slate-500 mt-1">Bài thi này được bảo vệ bằng mật khẩu</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 relative">
                            <input
                                type="password"
                                placeholder="Nhập mật khẩu bài thi..."
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError('')
                                }}
                                className={`w-full h-14 px-6 bg-slate-50 border-2 rounded-2xl focus:bg-white transition-all outline-none font-medium text-slate-700 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-brand-500'}`}
                            />
                            {error && (
                                <div className="absolute -bottom-6 left-2 flex items-center gap-1.5 text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!password.trim()}
                            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98] ${password.trim() ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200/50' : 'bg-slate-100 text-slate-300 shadow-none'}`}
                        >
                            Xác nhận <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
