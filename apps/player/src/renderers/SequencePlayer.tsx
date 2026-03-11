import { usePlayerStore } from '../store/playerStore'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export function SequencePlayer() {
    const { quiz, currentQuestionIndex, answers, setAnswer } = usePlayerStore()
    const question = quiz?.questions?.[currentQuestionIndex]

    if (!question || question.type !== 'sequence') return null

    // Initial state: shuffle the items if not already stored in answers
    const items = question.items || []

    // We store the array of IDs in the answers
    const currentOrder = (answers[question.id] as string[]) || items.map((i) => i.id)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over) return

        if (active.id !== over.id) {
            const oldIndex = currentOrder.indexOf(String(active.id))
            const newIndex = currentOrder.indexOf(String(over.id))
            const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
            setAnswer(question.id, newOrder)
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-6">
                Kéo thả để sắp xếp theo đúng thứ tự
            </p>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={currentOrder}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {currentOrder.map((id) => {
                            const item = items.find((i) => i.id === id)
                            return <SortableItem key={id} id={id} text={item?.text} />
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    )
}

function SortableItem({ id, text }: { id: string, text?: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                borderRadius: 'var(--qf-radius)',
                ...(isDragging ? { borderColor: 'var(--qf-primary)' } : {})
            }}
            className={`flex items-center gap-4 p-5 bg-white border-2 transition-all group ${isDragging ? 'shadow-2xl z-50 scale-105 opacity-80' : 'border-slate-100 shadow-sm'
                }`}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-300 transition-colors qf-hover-text"
            >
                <GripVertical className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-700">{text}</span>
        </div>
    )
}
