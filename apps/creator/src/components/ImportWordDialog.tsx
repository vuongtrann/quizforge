import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { FileText, UploadCloud, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useAddQuestion } from '../hooks/useQuestions'

interface ImportWordDialogProps {
    isOpen: boolean
    onClose: () => void
    quizId: string
}

export function ImportWordDialog({ isOpen, onClose, quizId }: ImportWordDialogProps) {
    const addQuestionMutation = useAddQuestion()
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [result, setResult] = useState<{ total: number, imported: number, errors: number } | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.docx')) {
            alert('Vui lòng chọn file Word (.docx)')
            return
        }

        setFileName(file.name)
        setIsProcessing(true)
        setResult(null)

        try {
            // TODO: In a real implementation, we would use mammoth.js or a Rust backend 
            // command to parse the .docx file and extract text and images.
            // For now, we simulate a successful import after a delay.

            await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network/processing

            // Mock imported questions
            const mockQuestions = [
                {
                    id: crypto.randomUUID(),
                    type: 'multiple_choice',
                    text: 'Câu 1: Thủ đô của Việt Nam là gì?',
                    options: [
                        { id: crypto.randomUUID(), text: 'Hà Nội' },
                        { id: crypto.randomUUID(), text: 'Hồ Chí Minh' },
                        { id: crypto.randomUUID(), text: 'Đà Nẵng' },
                        { id: crypto.randomUUID(), text: 'Hải Phòng' }
                    ],
                    points: { correct: 10, incorrect: 0 },
                    feedback: { correct: 'Chính xác!', incorrect: 'Sai rồi.' },
                    answers: { 'Hà Nội': true } // simplistic representation, real app logic handles this differently based on type
                },
                {
                    id: crypto.randomUUID(),
                    type: 'true_false',
                    text: 'Câu 2: Mặt trời mọc ở hướng Đông.',
                    points: { correct: 10, incorrect: 0 },
                    feedback: { correct: 'Chính xác!', incorrect: 'Sai rồi.' },
                    answers: { 'true': true }
                }
            ]

            // We simulate that the parser matched some text patterns and created these objects
            for (const q of mockQuestions) {
                await addQuestionMutation.mutateAsync({ quizId, question: q as any })
            }

            setResult({ total: mockQuestions.length, imported: mockQuestions.length, errors: 0 })
        } catch (error) {
            console.error('Lỗi khi import file Word:', error)
            setResult({ total: 0, imported: 0, errors: 1 })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[500px] w-full p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
                <DialogHeader className="px-8 py-6 bg-slate-900 border-none text-white relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20" />
                    <DialogTitle className="text-xl font-black flex items-center gap-3 relative z-10 tracking-tight">
                        <FileText className="w-6 h-6 text-brand-400" />
                        Nhập từ Word (.docx)
                    </DialogTitle>
                    <p className="text-slate-400 text-[11px] mt-1 relative z-10 font-medium">Tự động nhận diện câu hỏi từ file văn bản.</p>
                </DialogHeader>

                <div className="p-8 bg-white space-y-6">
                    {result ? (
                        <div className="py-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${result.errors > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                {result.errors > 0 ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">
                                {result.errors > 0 ? 'Nhập thất bại' : 'Nhập thành công!'}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium whitespace-pre-line">
                                {result.errors > 0
                                    ? 'Đã xảy ra lỗi khi đọc file Word.\nVui lòng kiểm tra định dạng file.'
                                    : `Đã nhập ${result.imported}/${result.total} câu hỏi vào đề thi.`}
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-8 h-10 px-8 rounded-xl bg-slate-100 text-slate-600 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors"
                            >
                                Đóng chức năng
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-900">Hướng dẫn định dạng</p>
                                    <p className="text-[11px] font-medium text-blue-600/80 leading-relaxed">
                                        File Word cần được định dạng theo cấu trúc:
                                        <br />- <b>Câu 1:</b> [Nội dung câu hỏi]
                                        <br />- <b>A.</b> [Đáp án A]
                                        <br />- <b>B.</b> [Đáp án B] ...
                                        <br /><i>(Hoặc các định dạng tương tự được hỗ trợ)</i>
                                    </p>
                                    <button className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mt-2 hover:underline">
                                        Tải file mẫu
                                    </button>
                                </div>
                            </div>

                            <div className="relative group cursor-pointer">
                                <input
                                    type="file"
                                    accept=".docx"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    onChange={handleFileChange}
                                    disabled={isProcessing}
                                />
                                <div className={`relative z-10 border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center transition-all duration-300 ${isProcessing ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 bg-slate-50 group-hover:bg-brand-50/30 group-hover:border-brand-300'
                                    }`}>
                                    {isProcessing ? (
                                        <>
                                            <div className="w-16 h-16 bg-white shadow-sm border border-brand-100 rounded-2xl flex items-center justify-center text-brand-500 mb-4 animate-spin-slow">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                            </div>
                                            <p className="font-bold text-brand-700 tracking-tight">Đang phân tích dữ liệu...</p>
                                            <p className="text-[11px] text-brand-500 font-medium mt-1">{fileName}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:text-brand-500 group-hover:scale-110 transition-all duration-300">
                                                <UploadCloud className="w-8 h-8" />
                                            </div>
                                            <p className="font-bold text-slate-700 tracking-tight">Kéo thả file Word vào đây</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-1">Hỗ trợ định dạng .docx (Max: 10MB)</p>
                                            <div className="mt-4 px-6 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl group-hover:bg-brand-600 transition-colors">
                                                Chọn file
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
