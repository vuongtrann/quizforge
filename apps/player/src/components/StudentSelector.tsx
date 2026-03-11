import { useState } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { Search, User, ArrowRight } from 'lucide-react'

export function StudentSelector() {
    const { students, selectStudent, selectedStudent, startQuiz, quiz } = usePlayerStore()
    const [searchTerm, setSearchTerm] = useState('')

    // For manual data collection mode
    const [manualInfo, setManualInfo] = useState({ name: '', class: '', studentId: '' })

    // Safely parse information from unknown
    const info = quiz?.information as Record<string, any> | undefined;
    const isManualCollection = info?.collectParticipantData?.enabled === true;
    const author = typeof info?.author === 'string' ? info.author : '';
    const description = typeof info?.description === 'string' ? info.description : '';

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.class?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleStart = () => {
        if (isManualCollection) {
            selectStudent({
                id: crypto.randomUUID(),
                name: manualInfo.name.trim() || 'Ẩn danh',
                class: manualInfo.class.trim(),
                studentId: manualInfo.studentId.trim()
            })
            startQuiz()
        } else if (selectedStudent || students.length === 0) {
            // If there's a selected student, or if there are no students loaded (just start)
            startQuiz()
        }
    }

    // Determine if start button should be enabled
    const canStart = isManualCollection
        ? manualInfo.name.trim().length > 0 // Require at least a name
        : (students.length === 0 || !!selectedStudent); // Require selection only if list exists

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden p-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{quiz?.title || 'BÀI KIỂM TRA'}</h1>
                        <p className="text-sm font-bold text-brand-600 uppercase tracking-widest">{quiz?.questions?.length || 0} CÂU HỎI • {quiz?.totalPoints || 0} ĐIỂM</p>
                        {Boolean(author) && (
                            <p className="text-xs text-slate-500 font-medium">Giáo viên: {author}</p>
                        )}
                        {Boolean(description) && (
                            <p className="text-sm text-slate-600 italic mt-4">{description}</p>
                        )}
                    </div>

                    {isManualCollection ? (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ và Tên (*)</label>
                                <input
                                    type="text"
                                    placeholder="Nhập họ và tên của bạn..."
                                    className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
                                    value={manualInfo.name}
                                    onChange={(e) => setManualInfo(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lớp / Khối</label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: 10A1"
                                        className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
                                        value={manualInfo.class}
                                        onChange={(e) => setManualInfo(prev => ({ ...prev, class: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mã Học Sinh</label>
                                    <input
                                        type="text"
                                        placeholder="Tùy chọn..."
                                        className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
                                        value={manualInfo.studentId}
                                        onChange={(e) => setManualInfo(prev => ({ ...prev, studentId: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : students.length > 0 ? (
                        <>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tên của bạn..."
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[240px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <button
                                            key={student.id}
                                            onClick={() => selectStudent(student)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${selectedStudent?.id === student.id
                                                ? 'bg-brand-600 text-white shadow-lg'
                                                : 'bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <User className={`w-4 h-4 ${selectedStudent?.id === student.id ? 'text-brand-200' : 'text-slate-400'}`} />
                                                <span className="font-bold">{student.name}</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedStudent?.id === student.id ? 'text-brand-200' : 'text-slate-400'}`}>
                                                {student.class}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-10 text-center space-y-2">
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Không tìm thấy tên</p>
                                        <p className="text-xs text-slate-400 italic">Vui lòng thử lại hoặc báo cho giáo viên.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="py-4 text-center">
                            <p className="text-sm text-slate-500 italic">Bấm Bắt đầu để làm bài thi.</p>
                        </div>
                    )}

                    <button
                        onClick={handleStart}
                        disabled={!canStart}
                        className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-xl ${canStart
                            ? 'bg-slate-900 text-white hover:bg-black shadow-brand-200/50'
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                            }`}
                    >
                        Bắt đầu làm bài <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
