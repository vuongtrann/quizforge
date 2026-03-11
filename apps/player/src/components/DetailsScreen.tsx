import { usePlayerStore } from '../store/playerStore'
import { ArrowRight, Info, User, Clock, CheckCircle2 } from 'lucide-react'

export function DetailsScreen() {
    const { quiz, setPhase } = usePlayerStore()

    const handleContinue = () => {
        setPhase('intro') // Proceed to student selection
    }

    const intro = quiz?.information?.introduction

    return (
        <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-start gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px]" />
                    <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-brand-500 shrink-0 relative z-10">
                        <Info className="w-7 h-7" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{intro?.title || 'Thông tin bài thi'}</h1>
                        <p className="text-sm font-bold text-brand-600 uppercase tracking-widest mt-1">{quiz?.title}</p>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative bg-white">
                    <div className="space-y-8 max-w-3xl">
                        {intro?.content && (
                            <div className="prose prose-slate prose-sm sm:prose-base prose-headings:font-black prose-p:font-medium prose-p:leading-relaxed prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline flex-1">
                                <div dangerouslySetInnerHTML={{ __html: intro.content }} />
                            </div>
                        )}

                        <div className="grid sm:grid-cols-3 gap-4 border-t border-slate-100 pt-8">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Thời gian</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {quiz?.settings?.timeLimit ? `${Math.round(quiz.settings.timeLimit / 60)} phút` : 'Không giới hạn'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Số câu hỏi</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {quiz?.questions?.length || 0} câu
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Chuẩn đạt</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {quiz?.settings?.passingRate || 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 shrink-0">
                    <button
                        onClick={handleContinue}
                        className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98] bg-slate-900 text-white hover:bg-black shadow-brand-200/50"
                    >
                        Tiếp tục <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
