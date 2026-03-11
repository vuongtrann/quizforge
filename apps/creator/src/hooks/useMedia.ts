import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

export const mediaKeys = {
    all: ['media'] as const,
    list: () => [...mediaKeys.all, 'list'] as const,
    detail: (id: string) => [...mediaKeys.all, 'detail', id] as const,
}

export function useUploadMedia() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ quizId, filters }: { quizId: string; filters?: { name: string; extensions: string[] }[] }) => {
            const selected = await open({
                multiple: false,
                filters: filters ?? [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
            })

            if (selected && typeof selected === 'string') {
                const media = await invoke<{ id: string }>('upload_media', {
                    quizId,
                    filePath: selected,
                })
                return media.id
            }
            return null
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: mediaKeys.list() })
        }
    })
}

export function useMediaData(mediaId: string | null) {
    return useQuery({
        queryKey: mediaKeys.detail(mediaId || ''),
        queryFn: async () => {
            if (!mediaId) return null
            return await invoke<string>('get_media_data', { mediaId })
        },
        enabled: !!mediaId
    })
}
