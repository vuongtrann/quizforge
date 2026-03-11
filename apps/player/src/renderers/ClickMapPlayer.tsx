import React, { useRef } from 'react'
import { usePlayerStore } from '../store/playerStore'
import type { QuizQuestion } from '../store/playerStore'

export function ClickMapPlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer } = usePlayerStore()
    const question: QuizQuestion | undefined = quiz?.questions?.[currentQuestionIndex]
    const imgRef = useRef<HTMLImageElement>(null)

    if (!question || question.type !== 'click_map') return null

    // Use question.media for the click map image
    const mediaData = question.media?.data
    const mapImageData = mediaData
        ? (mediaData.startsWith('data:') || mediaData.startsWith('http')
            ? mediaData
            : `data:${question.media?.mimeType ?? 'image/png'};base64,${mediaData}`)
        : undefined
    const currentClicks = (answers[question.id] as { x: number, y: number }[]) || []

    const handleImageClick = (e: React.MouseEvent) => {
        if (!imgRef.current) return

        const rect = imgRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        if (question.allowMultipleClicks) {
            setAnswer(question.id, [...currentClicks, { x, y }])
        } else {
            setAnswer(question.id, [{ x, y }])
        }
    }

    const clearClicks = () => {
        setAnswer(question.id, [])
    }

    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="relative group cursor-crosshair rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                <img
                    ref={imgRef}
                    src={mapImageData || 'https://placehold.co/800x600?text=CLICK+MAP+IMAGE'}
                    alt="Click Map"
                    className="max-w-full block select-none"
                    onClick={handleImageClick}
                />

                {/* Visual Indicators for Clicks */}
                {currentClicks.map((click, i) => (
                    <div
                        key={i}
                        className="absolute w-8 h-8 -ml-4 -mt-4 bg-brand-500/50 border-4 border-white rounded-full animate-ping-once pointer-events-none"
                        style={{ left: `${click.x}%`, top: `${click.y}%` }}
                    />
                ))}
            </div>

            <div className="flex gap-4 items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Click vào vị trí đúng trên hình ảnh
                </p>
                {currentClicks.length > 0 && (
                    <button
                        onClick={clearClicks}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700"
                    >
                        Xóa chọn
                    </button>
                )}
            </div>
        </div>
    )
}
