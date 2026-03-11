import { Extension } from '@tiptap/core'
import type { CommandProps } from '@tiptap/core'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontSize: {
            setFontSize: (size: string) => ReturnType
            unsetFontSize: () => ReturnType
        }
    }
}

export const FontSize = Extension.create({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: (attributes: Record<string, unknown>) => {
                            if (!attributes.fontSize) return {}
                            return { style: `font-size: ${attributes.fontSize}` }
                        },
                    },
                },
            },
        ]
    },

    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }: CommandProps) => {
                return chain().setMark('textStyle', { fontSize }).run()
            },
            unsetFontSize: () => ({ chain }: CommandProps) => {
                return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
            },
        }
    },
})
