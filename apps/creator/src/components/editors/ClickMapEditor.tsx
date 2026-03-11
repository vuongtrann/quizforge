import { useState } from "react"
import { ClickMapQuestion, Hotspot, type Media } from "@quizforge/types"

const EMPTY_MAP_IMAGE: Media = {
    id: '',
    type: 'image',
    filename: '',
    mimeType: '',
    data: '',
}
import { Button } from "../ui/button"
import { Plus, Trash2, Image as ImageIcon, Crosshair, HelpCircle } from "lucide-react"
import { cn } from "../../lib/utils"

interface ClickMapEditorProps {
    question: ClickMapQuestion
    onChange: (question: ClickMapQuestion) => void
}

export function ClickMapEditor({ question, onChange }: ClickMapEditorProps) {
    const hotspots = question.hotspots || []
    const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null)

    const handleAddHotspot = () => {
        const newHotspot: Hotspot = {
            id: crypto.randomUUID(),
            shape: 'rect',
            coords: [10, 10, 80, 80],
            isCorrect: true,
            label: `Hotspot ${hotspots.length + 1}`
        }
        onChange({ ...question, hotspots: [...hotspots, newHotspot] })
        setSelectedHotspot(newHotspot.id)
    }

    const handleRemoveHotspot = (id: string) => {
        onChange({ ...question, hotspots: hotspots.filter(h => h.id !== id) })
        if (selectedHotspot === id) setSelectedHotspot(null)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        Hình ảnh cần xác định (Click Map)
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                </div>

                {question.mapImage?.data ? (
                    <div className="relative border rounded-xl overflow-hidden bg-slate-100 group">
                        <img src={question.mapImage.data} className="w-full h-auto min-h-[200px] object-contain mx-auto" alt="Reference" />

                        {/* Render Hotspots Overlay */}
                        {hotspots.map(h => {
                            const [x, y, w, h_val] = h.coords
                            return (
                                <div
                                    key={h.id}
                                    className={cn(
                                        "absolute border-2 transition-all cursor-pointer",
                                        selectedHotspot === h.id ? "bg-brand-500/20 shadow-lg border-brand-500 shadow-brand-500/30 ring-2 ring-brand-500/20" : "bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20"
                                    )}
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        width: `${w}%`,
                                        height: `${h_val}%`,
                                        borderRadius: h.shape === 'circle' ? '50%' : '4px'
                                    }}
                                    onClick={() => setSelectedHotspot(h.id)}
                                >
                                    <div className="bg-emerald-600 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm absolute -top-4 left-0 truncate max-w-[60px] shadow-sm">
                                        {h.label}
                                    </div>
                                </div>
                            )
                        })}

                        <button
                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onChange({ ...question, mapImage: EMPTY_MAP_IMAGE })}
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Click để tải ảnh lên (Yêu cầu)</p>
                        <p className="text-xs text-slate-400">JPG, PNG, GIF (Max 10MB)</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-2 flex items-center justify-between">
                    Vùng xác định (Hotspots)
                    <Button variant="ghost" size="sm" onClick={handleAddHotspot} disabled={!question.mapImage?.data} className="h-7 px-3 text-brand-600 hover:bg-brand-50 text-[10px] uppercase font-bold tracking-tight border border-brand-100 rounded-full shadow-sm bg-white">
                        <Plus className="w-3.5 h-3.5 mr-1" /> THÊM VÙNG MỚI
                    </Button>
                </div>

                {hotspots.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                        {question.mapImage?.data ? "Chưa định nghĩa vùng nào." : "Phải tải ảnh lên trước khi thêm vùng."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {hotspots.map((h) => (
                            <div key={h.id} className={cn(
                                "flex items-center gap-3 bg-white border p-3 rounded-xl transition-all shadow-sm group",
                                selectedHotspot === h.id ? "border-brand-500 ring-2 ring-brand-500/10" : "border-slate-200 hover:border-brand-300"
                            )} onClick={() => setSelectedHotspot(h.id)}>
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                                    <Crosshair className="w-4 h-4" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 text-left">
                                    <input
                                        type="text"
                                        className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 h-4"
                                        placeholder="Tên vùng..."
                                        value={h.label || ''}
                                        onChange={(e) => {
                                            const newHotspots = hotspots.map(item => item.id === h.id ? { ...item, label: e.target.value } : item)
                                            onChange({ ...question, hotspots: newHotspots })
                                        }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <select className="bg-transparent border-none text-[10px] text-slate-500 p-0 focus:ring-0" value={h.shape} onChange={(e) => {
                                            const newHotspots = hotspots.map(item => item.id === h.id ? { ...item, shape: e.target.value as Hotspot['shape'] } : item)
                                            onChange({ ...question, hotspots: newHotspots })
                                        }}>
                                            <option value="rect">Hình chữ nhật</option>
                                            <option value="circle">Hình tròn</option>
                                            <option value="polygon">Đa giác</option>
                                        </select>
                                        <span className="text-[10px] text-slate-300 font-mono">[{h.coords.join(',')}]</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveHotspot(h.id); }}
                                    className="p-1 px-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={question.allowMultipleClicks}
                            onChange={(e) => onChange({ ...question, allowMultipleClicks: e.target.checked })}
                            className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-[11px] font-medium text-slate-500">Cho phép chọn nhiều vùng</span>
                    </label>
                </div>
            </div>
        </div>
    )
}
