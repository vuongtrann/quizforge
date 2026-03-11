# P1.1 — Question Editor System
> **Senior Engineer Assessment** — Đọc kỹ trước khi code
> Cập nhật: 2026-03-08

---

## THỰC TẾ HIỆN TẠI (sau khi đọc source)

> **Đây KHÔNG phải stub rỗng** — code đã có nhiều hơn task.md ghi. Vấn đề là chất lượng và tính đúng đắn.

### Cái gì đã có:
| File | Trạng thái thực tế |
|---|---|
| `QuestionEditorDialog.tsx` | Shell có, nhưng đầy `as any`, logic onSave không validate, Prev/Next không hoạt động |
| `TrueFalseEditor.tsx` | ✅ Hoạt động được — radio Đúng/Sai, đổi màu theo state |
| `MultipleChoiceEditor.tsx` | ✅ Hoạt động cơ bản — add/remove option, toggle correct, shuffle |
| `MultipleResponseEditor.tsx` | ✅ Hoạt động cơ bản — checkbox, partial scoring toggle |
| `FillInBlankEditor.tsx` | ⚠️ Hoạt động nhưng UX kém — blank marker dùng `{{blank_xxxx}}` khó dùng |
| `MatchingEditor.tsx` | ✅ Hoạt động cơ bản — 2 cột textarea, shuffle toggles |
| `SequenceEditor.tsx` | ✅ Hoạt động — up/down buttons thay dnd-kit, partial scoring |
| `WordBankEditor.tsx` | ⚠️ UX rối — "GÁN VÀO VĂN BẢN" button khó hiểu với user |
| `ClickMapEditor.tsx` | ⚠️ Hotspot list OK, nhưng không thể vẽ từ click vào ảnh (coords phải nhập tay) |
| `ShortEssayEditor.tsx` | ✅ Hoạt động — reference answer, keywords, maxWords |
| `BlankPageEditor.tsx` | ✅ Hoạt động — title, content, showTimer |
| `RichTextEditor.tsx` | ⚠️ Tiptap OK nhưng thiếu placeholder, toolbar B/I trong dialog không kết nối |
| `QuizEditor.tsx` | ⚠️ Dùng `any` toàn bộ cho defaultQuestion, handleAddQuestion |

### Bugs quan trọng cần fix:
1. **`QuestionEditorDialog.tsx` dùng `as any` 10+ chỗ** — vi phạm spec tuyệt đối
2. **Không validate trước khi save** — có thể save câu hỏi rỗng, MC không có đáp án đúng
3. **Prev/Next footer buttons không wired** — chỉ là UI decoration
4. **Feedback section thiếu trong dialog** — không edit được feedback.correct/incorrect text
5. **Toolbar B/I/U buttons** không kết nối Tiptap editor instance
6. **`RichTextEditor`** không nhận placeholder thật từ Tiptap (prop có nhưng không dùng)
7. **WordBankEditor UX** — flow "chọn word → toggle slot → placeholder vào text" rất confusing
8. **ClickMapEditor** — hotspot coords phải nhập tay (không click-to-draw được)
9. **`QuizEditor.tsx` handleAddQuestion** — `defaultQuestion: any` và `as any` casting
10. **useUpdateQuestion hook** — `quizId: _quizId` (underscore prefix = unused param) nhưng invalidate dùng nó

---

## KẾ HOẠCH FIX CHI TIẾT

### TASK 1: Fix QuestionEditorDialog.tsx (Quan trọng nhất)

**Vấn đề cụ thể:**
```tsx
// HIỆN TẠI — SAI
setEditedQuestion({ ...question })                    // question: Question | null
<TrueFalseEditor question={q as any} .../>            // as any
onChange={(newQ) => setEditedQuestion(newQ as any)}   // as any
onSave(editedQuestion)                                // không validate
```

**Cần fix:**

#### 1a. Bỏ toàn bộ `as any` — dùng type narrowing đúng
```tsx
// Thay switch(q.type) dùng as any, dùng discriminated union đúng cách
const renderEditor = () => {
    switch (editedQuestion.type) {
        case 'true_false':
            return (
                <TrueFalseEditor
                    question={editedQuestion}  // TypeScript biết đây là TrueFalseQuestion
                    onChange={setEditedQuestion}
                />
            )
        case 'multiple_choice':
            return (
                <MultipleChoiceEditor
                    question={editedQuestion}  // TypeScript biết đây là MultipleChoiceQuestion
                    onChange={setEditedQuestion}
                />
            )
        // ...
    }
}
```
> Chỉ cần `editedQuestion` có đúng type → TypeScript tự narrow trong switch.

#### 1b. Thêm Feedback Section vào dialog
Hiện tại dialog thiếu phần edit feedback.correct / feedback.incorrect.
Thêm section này vào Main Workspace, sau type-specific editor:
```tsx
{/* Feedback Section */}
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">
        Phản hồi sau khi nộp câu
    </div>
    <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">✓ Khi đúng</span>
            <input
                type="text"
                className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                value={editedQuestion.feedback.correct}
                onChange={(e) => setEditedQuestion({
                    ...editedQuestion,
                    feedback: { ...editedQuestion.feedback, correct: e.target.value }
                })}
            />
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-red-500 uppercase">✗ Khi sai</span>
            <input
                type="text"
                className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500"
                value={editedQuestion.feedback.incorrect}
                onChange={(e) => setEditedQuestion({
                    ...editedQuestion,
                    feedback: { ...editedQuestion.feedback, incorrect: e.target.value }
                })}
            />
        </div>
    </div>
</div>
```

#### 1c. Validation trước khi save
```tsx
const [validationErrors, setValidationErrors] = useState<string[]>([])

const handleSave = () => {
    const errors: string[] = []

    // Rule 1: Câu hỏi phải có nội dung
    if (!editedQuestion.text.trim() && !editedQuestion.richText?.trim()) {
        errors.push('Nội dung câu hỏi không được để trống')
    }

    // Rule 2: MC/MR phải có đáp án đúng
    if (editedQuestion.type === 'multiple_choice') {
        const hasCorrect = editedQuestion.options.some(o => o.isCorrect)
        if (!hasCorrect) errors.push('Phải chọn ít nhất 1 đáp án đúng')
        const emptyOptions = editedQuestion.options.filter(o => !o.text.trim())
        if (emptyOptions.length > 0) errors.push('Các lựa chọn không được để trống')
    }
    if (editedQuestion.type === 'multiple_response') {
        const hasCorrect = editedQuestion.options.some(o => o.isCorrect)
        if (!hasCorrect) errors.push('Phải chọn ít nhất 1 đáp án đúng')
    }

    // Rule 3: FITB phải có ít nhất 1 blank với đáp án
    if (editedQuestion.type === 'fill_in_blank') {
        if (editedQuestion.blanks.length === 0) errors.push('Phải có ít nhất 1 ô trống')
        const emptyBlanks = editedQuestion.blanks.filter(b =>
            b.acceptableAnswers.every(a => !a.trim())
        )
        if (emptyBlanks.length > 0) errors.push('Các ô trống phải có ít nhất 1 đáp án')
    }

    // Rule 4: Matching phải có ít nhất 2 cặp và không trống
    if (editedQuestion.type === 'matching') {
        if (editedQuestion.pairs.length < 2) errors.push('Phải có ít nhất 2 cặp ghép')
        const emptyPairs = editedQuestion.pairs.filter(p => !p.choice.trim() || !p.match.trim())
        if (emptyPairs.length > 0) errors.push('Tất cả vế A và vế B phải có nội dung')
    }

    // Rule 5: Sequence phải có ít nhất 2 items
    if (editedQuestion.type === 'sequence') {
        if (editedQuestion.items.length < 2) errors.push('Phải có ít nhất 2 phần tử')
        const emptyItems = editedQuestion.items.filter(i => !i.text.trim())
        if (emptyItems.length > 0) errors.push('Các phần tử không được để trống')
    }

    // Rule 6: ClickMap phải có ảnh và ít nhất 1 hotspot đúng
    if (editedQuestion.type === 'click_map') {
        if (!editedQuestion.mapImage) errors.push('Phải tải ảnh lên')
        const hasCorrect = editedQuestion.hotspots.some(h => h.isCorrect)
        if (!hasCorrect) errors.push('Phải có ít nhất 1 vùng đúng')
    }

    if (errors.length > 0) {
        setValidationErrors(errors)
        return
    }

    setValidationErrors([])
    onSave(editedQuestion)
}
```

**Hiển thị validation errors:**
```tsx
{/* Trong footer, trên buttons */}
{validationErrors.length > 0 && (
    <div className="flex-1 mx-4">
        {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-600 font-medium flex items-center gap-1">
                <span>⚠</span> {err}
            </p>
        ))}
    </div>
)}
```

#### 1d. Wire Prev/Next buttons
Dialog cần nhận thêm props:
```tsx
interface QuestionEditorDialogProps {
    question: Question | null
    questionIndex: number          // thêm
    totalQuestions: number         // thêm
    isOpen: boolean
    onClose: () => void
    onSave: (question: Question) => void
    onNavigate?: (direction: 'prev' | 'next') => void  // thêm
}
```

```tsx
// Footer buttons
<Button
    variant="outline"
    size="sm"
    disabled={questionIndex <= 0}
    onClick={() => onNavigate?.('prev')}
    className="h-9 gap-2 text-xs font-bold border-slate-200 hover:bg-slate-50"
>
    <ChevronLeft className="w-3.5 h-3.5" /> TRƯỚC
</Button>
<Button
    variant="outline"
    size="sm"
    disabled={questionIndex >= totalQuestions - 1}
    onClick={() => onNavigate?.('next')}
    className="h-9 gap-2 text-xs font-bold border-slate-200 hover:bg-slate-50"
>
    SAU <ChevronRight className="w-3.5 h-3.5" />
</Button>

{/* Question position indicator */}
<span className="text-[11px] font-mono text-slate-400 px-2">
    {questionIndex + 1} / {totalQuestions}
</span>
```

#### 1e. Fix RichTextEditor placeholder
```tsx
// Tiptap placeholder cần extension riêng, hoặc dùng CSS ::before
// Cách đơn giản nhất: editorProps attributes
editorProps: {
    attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none min-h-[100px] p-4',
        'data-placeholder': placeholder || '',
    },
},
```

CSS trong `index.css`:
```css
.tiptap p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
}
```

#### 1f. Wire toolbar B/I/U đến Tiptap
RichTextEditor cần expose editor ref hoặc dùng callback:
```tsx
// Option 1: Thêm ref forwarding
export const RichTextEditor = forwardRef<Editor | null, RichTextEditorProps>(
    ({ content, onChange, placeholder, className }, ref) => {
        const editor = useEditor({ ... })
        useImperativeHandle(ref, () => editor, [editor])
        // ...
    }
)

// Trong QuestionEditorDialog, toolbar buttons:
const editorRef = useRef<Editor | null>(null)

<Button onClick={() => editorRef.current?.chain().focus().toggleBold().run()}>B</Button>
<Button onClick={() => editorRef.current?.chain().focus().toggleItalic().run()}>I</Button>
```

> **Quyết định**: Option đơn giản hơn — không wire toolbar trong dialog, vì Tiptap đã có keyboard shortcuts (Ctrl+B/I/U). Toolbar UI giữ nguyên nhưng chú thích `title="Ctrl+B"` trên button.

---

### TASK 2: Fix QuizEditor.tsx — Bỏ `any`

```tsx
// HIỆN TẠI — SAI
const defaultQuestion: any = { ... }
if (type === 'multiple_choice' || type === 'multiple_response') {
    defaultQuestion.options = [...]  // dynamic property trên any
}

// CẦN SỬA — Type-safe factory function
function createDefaultQuestion(type: QuestionType, order: number): Question {
    const base = {
        id: crypto.randomUUID(),
        text: '',
        points: { correct: 10, incorrect: 0 },
        feedback: { correct: 'Chính xác!', incorrect: 'Chưa đúng rồi.' },
        feedbackMode: 'by_question' as const,
        attempts: 1,
        order,
    }

    switch (type) {
        case 'true_false':
            return { ...base, type, correctAnswer: 'true' }
        case 'multiple_choice':
            return {
                ...base, type,
                options: [
                    { id: crypto.randomUUID(), text: 'Lựa chọn 1', isCorrect: true },
                    { id: crypto.randomUUID(), text: 'Lựa chọn 2', isCorrect: false },
                ],
                shuffleOptions: false,
            }
        case 'multiple_response':
            return {
                ...base, type,
                options: [
                    { id: crypto.randomUUID(), text: 'Lựa chọn 1', isCorrect: true },
                    { id: crypto.randomUUID(), text: 'Lựa chọn 2', isCorrect: false },
                ],
                shuffleOptions: false,
                partialScoring: false,
            }
        case 'fill_in_blank':
            return { ...base, type, templateText: '', blanks: [] }
        case 'matching':
            return {
                ...base, type,
                pairs: [
                    { id: crypto.randomUUID(), choice: '', match: '' },
                    { id: crypto.randomUUID(), choice: '', match: '' },
                ],
                shuffleChoices: false,
                shuffleMatches: false,
            }
        case 'sequence':
            return {
                ...base, type,
                items: [
                    { id: crypto.randomUUID(), text: '', correctOrder: 0 },
                    { id: crypto.randomUUID(), text: '', correctOrder: 1 },
                ],
                partialScoring: false,
            }
        case 'word_bank':
            return {
                ...base, type,
                templateText: '',
                slots: [],
                words: [],
                shuffleWords: false,
            }
        case 'click_map':
            return {
                ...base, type,
                hotspots: [],
                allowMultipleClicks: false,
            }
        case 'short_essay':
            return {
                ...base, type,
                referenceAnswer: '',
                keywordMatching: [],
                maxWords: 0,
                points: { correct: 0, incorrect: 0 }, // override — manual grading
            }
        case 'blank_page':
            return {
                ...base, type,
                title: '',
                content: '',
                showTimer: true,
                points: { correct: 0, incorrect: 0 }, // override — no scoring
            }
    }
}
```

---

### TASK 3: Wire Navigation trong QuizEditor.tsx

QuizEditor cần track `editingQuestionIndex` để Prev/Next hoạt động:

```tsx
// Thêm state
const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(-1)

// Khi click row để edit:
const handleEditQuestion = (question: Question, index: number) => {
    setEditingQuestion(question)
    setEditingQuestionIndex(index)
    setIsEditorOpen(true)
}

// Navigate handler
const handleNavigate = (direction: 'prev' | 'next') => {
    // Auto-save current question trước khi navigate
    // (hoặc hiển thị confirm nếu có thay đổi)
    const newIndex = direction === 'prev'
        ? editingQuestionIndex - 1
        : editingQuestionIndex + 1
    if (newIndex >= 0 && newIndex < questions.length) {
        setEditingQuestion(questions[newIndex])
        setEditingQuestionIndex(newIndex)
    }
}

// Pass vào dialog
<QuestionEditorDialog
    question={editingQuestion}
    questionIndex={editingQuestionIndex}
    totalQuestions={questions.length}
    isOpen={isEditorOpen}
    onClose={() => setIsEditorOpen(false)}
    onSave={handleSaveQuestion}
    onNavigate={handleNavigate}
/>
```

---

### TASK 4: Fix WordBankEditor UX

Vấn đề: Flow hiện tại quá phức tạp, user không hiểu "GÁN VÀO VĂN BẢN".

**Redesign UX:**

Tách thành 2 vùng rõ ràng:

**Vùng 1: Template Text** (giữ nguyên textarea)
- Hướng dẫn rõ: "Dùng `[_]` để đánh dấu chỗ trống. Ví dụ: `Thủ đô của Việt Nam là [_].`"
- Nút "Chèn [_]" thêm `[_]` vào vị trí cursor trong textarea
- Auto-detect số lượng `[_]` → tự tạo slots tương ứng

**Vùng 2: Từ cho vào slot** (đúng thứ tự với `[_]`)
- Slot 1, Slot 2, ... — mỗi slot có 1 input "Đáp án đúng"

**Vùng 3: Từ phụ (Distractors)**
- List từ thêm vào ngân hàng nhưng không phải đáp án
- Nút "+ Thêm từ phụ"

```tsx
// Logic mới: parse template tìm [_] để biết số slots
const parseSlots = (template: string): number => {
    return (template.match(/\[_\]/g) || []).length
}

// Khi template thay đổi, sync số lượng slots
useEffect(() => {
    const count = parseSlots(question.templateText)
    if (count !== question.slots.length) {
        const newSlots = Array.from({ length: count }, (_, i) => ({
            id: question.slots[i]?.id || crypto.randomUUID(),
            position: i,
            correctWordId: question.slots[i]?.correctWordId || '',
        }))
        onChange({ ...question, slots: newSlots })
    }
}, [question.templateText])
```

---

### TASK 5: ClickMapEditor — Vẽ hotspot bằng click/drag trên ảnh

Vấn đề: Hiện tại coords phải nhập tay `[10, 10, 80, 80]` — không dùng được.

**Implement drag-to-draw:**

```tsx
const [isDrawing, setIsDrawing] = useState(false)
const [drawStart, setDrawStart] = useState<{x: number, y: number} | null>(null)
const [drawCurrent, setDrawCurrent] = useState<{x: number, y: number} | null>(null)
const imageRef = useRef<HTMLDivElement>(null)

const getRelativeCoords = (e: React.MouseEvent) => {
    const rect = imageRef.current!.getBoundingClientRect()
    return {
        x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
        y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
    }
}

const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== imageRef.current && !(e.target as HTMLElement).tagName === 'IMG') return
    e.preventDefault()
    setIsDrawing(true)
    setDrawStart(getRelativeCoords(e))
}

const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return
    setDrawCurrent(getRelativeCoords(e))
}

const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return
    const end = getRelativeCoords(e)

    const x = Math.min(drawStart.x, end.x)
    const y = Math.min(drawStart.y, end.y)
    const w = Math.abs(end.x - drawStart.x)
    const h = Math.abs(end.y - drawStart.y)

    if (w > 3 && h > 3) { // Ignore tiny accidental clicks
        const newHotspot: Hotspot = {
            id: crypto.randomUUID(),
            shape: 'rect',
            coords: [x, y, w, h],
            isCorrect: true,
            label: `Vùng ${hotspots.length + 1}`,
        }
        onChange({ ...question, hotspots: [...hotspots, newHotspot] })
    }

    setIsDrawing(false)
    setDrawStart(null)
    setDrawCurrent(null)
}

// Render: live preview khi đang vẽ
{isDrawing && drawStart && drawCurrent && (
    <div
        className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
        style={{
            left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
            top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
            width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
            height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
        }}
    />
)}
```

Thêm instruction bar trên ảnh:
```tsx
<div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-2 mb-2">
    <Crosshair className="w-3.5 h-3.5" />
    Kéo chuột trên ảnh để vẽ vùng xác định. Click vào vùng đã vẽ để chỉnh sửa.
</div>
```

---

## THỨ TỰ IMPLEMENT

```
Session 1 (bắt đầu ngay):
├── TASK 2: createDefaultQuestion() factory trong QuizEditor.tsx  [30 phút]
├── TASK 1a: Bỏ as any trong QuestionEditorDialog             [30 phút]
├── TASK 1b: Thêm Feedback Section vào dialog                 [20 phút]
├── TASK 1c: Validation trước khi save                        [40 phút]
└── TASK 1d: Wire Prev/Next + navigation props                [30 phút]

Session 2:
├── TASK 1e: Fix RichTextEditor placeholder (CSS)             [15 phút]
├── TASK 4: Redesign WordBankEditor UX                        [60 phút]
└── TASK 5: ClickMapEditor drag-to-draw                       [90 phút]
```

---

## FILES SẼ BỊ THAY ĐỔI

| File | Loại thay đổi |
|---|---|
| `apps/creator/src/components/QuestionEditorDialog.tsx` | Rewrite phần lớn |
| `apps/creator/src/pages/QuizEditor.tsx` | Thêm factory function, fix state |
| `apps/creator/src/components/RichTextEditor.tsx` | Thêm placeholder CSS |
| `apps/creator/src/components/editors/WordBankEditor.tsx` | Redesign UX |
| `apps/creator/src/components/editors/ClickMapEditor.tsx` | Thêm drag-to-draw |
| `apps/creator/src/index.css` | Thêm Tiptap placeholder CSS |

**KHÔNG cần thay đổi:**
- TrueFalseEditor ✅
- MultipleChoiceEditor ✅ (chỉ minor: validate empty options)
- MultipleResponseEditor ✅
- FillInBlankEditor ✅
- MatchingEditor ✅
- SequenceEditor ✅
- ShortEssayEditor ✅
- BlankPageEditor ✅

---

## ACCEPTANCE CRITERIA

Sau khi hoàn thành P1.1, phải pass được:

- [ ] Tạo quiz mới → Add Question → chọn type → dialog mở đúng loại editor
- [ ] Mọi 10 loại question type đều hiển thị đúng editor
- [ ] Save câu hỏi rỗng → hiện validation error, không save
- [ ] MC không có đáp án đúng → validation error
- [ ] FITB không có blank → validation error
- [ ] ClickMap không có ảnh → validation error
- [ ] Save thành công → câu hỏi xuất hiện trong QuizEditor list
- [ ] Click câu hỏi trong list → dialog mở với dữ liệu đúng
- [ ] Prev/Next trong dialog → chuyển qua lại câu hỏi (auto-save)
- [ ] Edit feedback text → lưu vào question.feedback.correct/incorrect
- [ ] WordBank: nhập template với `[_]` → slot tự tạo
- [ ] ClickMap: drag trên ảnh → vẽ được hotspot
- [ ] Zero TypeScript errors (`pnpm typecheck` pass)
- [ ] Không có `as any` hoặc `: any` trong các files đã sửa

---

## NOTES KỸ THUẬT

### Về QuestionEditorDialog type safety
TypeScript discriminated union hoạt động trong switch-case:
```tsx
// editedQuestion: Question (union của 10 types)
switch (editedQuestion.type) {
    case 'true_false':
        // ở đây editedQuestion được TypeScript narrow thành TrueFalseQuestion tự động
        // Không cần as any!
        return <TrueFalseEditor question={editedQuestion} onChange={setEditedQuestion} />
}
```
Tuy nhiên `onChange` prop của TrueFalseEditor nhận `TrueFalseQuestion`, còn `setEditedQuestion` expect `Question`. Cần:
```tsx
// Option A: Cast trong onChange (minimal change)
onChange={(q) => setEditedQuestion(q as Question)}  // safe vì q là TrueFalseQuestion ⊂ Question

// Option B: Tạo typed setter (cleaner)
const handleEditorChange = <T extends Question>(q: T) => setEditedQuestion(q)
```

### Về onSave type
```tsx
// Khi save, cần đảm bảo BlankPage không được count là question
// BlankPage không có points thật → cần xử lý riêng ở QuizEditor level
// Dialog chỉ save raw data, QuizEditor quyết định cách store
```

### Import `QuestionType` từ types
```tsx
import { Question, QuestionType, TrueFalseQuestion, ... } from '@quizforge/types'
```

### Về `text` validation
Tiptap store content dưới dạng HTML (vd: `<p></p>` khi rỗng).
Validation cần check cả `text` field (plain) và strip HTML để check:
```tsx
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()
const isEmpty = !editedQuestion.text.trim() &&
    stripHtml(editedQuestion.richText || '') === ''
```
