import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Color from '@tiptap/extension-color'
import { FontSize } from '../lib/tiptap-font-size'
import { useEffect } from 'react'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
    className?: string
    onEditorReady?: (editor: Editor) => void
}

export function RichTextEditor({ content, onChange, placeholder, className, onEditorReady }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Underline,
            TextStyle,
            FontFamily,
            Color,
            FontSize,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none min-h-[90px] p-3 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none',
                'data-placeholder': placeholder || '',
            },
        },
    })

    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor])

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    return (
        <div className={className}>
            <EditorContent editor={editor} />
        </div>
    )
}
