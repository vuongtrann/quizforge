import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "./ui/dialog"
import { Button } from "./ui/button"
import {
    Users,
    Upload,
    UserPlus,
    Trash2,
    Search,
    FileSpreadsheet,
    Download
} from "lucide-react"
import { Student } from "@quizforge/types"
import * as XLSX from 'xlsx'
import { open, save } from "@tauri-apps/plugin-dialog"
import { readFile, writeFile } from "@tauri-apps/plugin-fs"

interface StudentListDialogProps {
    isOpen: boolean
    onClose: () => void
    students: Student[]
    onSave: (students: Student[]) => void
}

export function StudentListDialog({ isOpen, onClose, students, onSave }: StudentListDialogProps) {
    const [localStudents, setLocalStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (isOpen) {
            setLocalStudents(JSON.parse(JSON.stringify(students || [])))
        }
    }, [isOpen, students])

    const handleAddStudent = () => {
        const newStudent: Student = {
            id: crypto.randomUUID(),
            name: `Học sinh mới ${localStudents.length + 1}`,
            className: "",
            orderIndex: localStudents.length + 1
        }
        setLocalStudents([...localStudents, newStudent])
    }

    const handleRemoveStudent = (id: string) => {
        setLocalStudents(localStudents.filter(s => s.id !== id))
    }

    const handleUpdateStudent = (id: string, fields: Partial<Student>) => {
        setLocalStudents(localStudents.map(s => s.id === id ? { ...s, ...fields } : s))
    }

    const handleImportExcel = async () => {
        const selected = await open({
            multiple: false,
            filters: [{ name: 'Excel File', extensions: ['xlsx', 'xls', 'csv'] }]
        })
        if (selected && typeof selected === 'string') {
            const fileData = await readFile(selected)
            const workbook = XLSX.read(fileData, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const data: any[] = XLSX.utils.sheet_to_json(worksheet)

            const importedStudents: Student[] = data.map((row, index) => ({
                id: crypto.randomUUID(),
                name: row['Họ và tên'] || row['Name'] || row['name'] || 'Unknown',
                className: row['Lớp'] || row['Class'] || row['class'] || '',
                orderIndex: index + 1
            }))

            setLocalStudents([...localStudents, ...importedStudents])
        }
    }

    const handleDownloadTemplate = async () => {
        const exportPath = await save({
            defaultPath: 'Template_HocSinh.xlsx',
            filters: [{ name: 'Excel File', extensions: ['xlsx'] }]
        })

        if (exportPath) {
            const ws = XLSX.utils.aoa_to_sheet([
                ['STT', 'Họ và tên', 'Lớp'],
                [1, 'Nguyễn Văn A', '12A1'],
                [2, 'Trần Thị B', '12A1']
            ])
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Students")
            const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
            await writeFile(exportPath, new Uint8Array(buf))
        }
    }

    const handleSave = () => {
        onSave(localStudents)
        onClose()
    }

    const filteredStudents = localStudents.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.className || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[800px] w-full h-[600px] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50 flex-shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-600" />
                        Quản lý danh sách học sinh
                    </DialogTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2"
                        >
                            <Download className="w-3 h-3" /> Tên mẫu (Excel)
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleImportExcel}
                            className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        >
                            <Upload className="w-3 h-3" /> Nạp từ Excel
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Toolbar */}
                    <div className="px-6 py-3 border-b flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="text"
                                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                                placeholder="Tìm kiếm theo tên hoặc lớp..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleAddStudent} className="h-10 px-4 rounded-xl text-brand-600 hover:bg-brand-50 font-bold uppercase tracking-widest text-[10px] gap-2">
                            <UserPlus className="w-4 h-4" /> Thêm thủ công
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-slate-50 border-b z-10">
                                <tr>
                                    <th className="w-16 px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">STT</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Họ và tên</th>
                                    <th className="w-32 px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lớp</th>
                                    <th className="w-20 px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="text-xs font-mono font-bold text-slate-300">{(index + 1).toString().padStart(2, '0')}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="text"
                                                    value={student.name}
                                                    onChange={(e) => handleUpdateStudent(student.id, { name: e.target.value })}
                                                    className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 p-0 outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="text"
                                                    value={student.className || ""}
                                                    placeholder="N/A"
                                                    onChange={(e) => handleUpdateStudent(student.id, { className: e.target.value })}
                                                    className="w-full bg-transparent border-none text-xs font-medium text-slate-500 focus:ring-0 p-0 outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleRemoveStudent(student.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                                                    <Users className="w-8 h-8" />
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">Chưa có dữ liệu</p>
                                                    <p className="text-[10px] text-slate-300 leading-relaxed italic">Vui lòng nạp tệp Excel hoặc thêm học sinh thủ công.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info */}
                    <div className="px-6 py-3 bg-slate-50 border-t flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Tổng số: {localStudents.length} học sinh</span>
                        <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> XLS / CSV Ready</span>
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-white flex items-center justify-end flex-shrink-0 gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Đóng</Button>
                    <Button variant="default" size="sm" onClick={handleSave} className="px-10 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-brand-500/20 active:scale-95 transition-all">Lưu danh sách</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
