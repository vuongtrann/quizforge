/**
 * Quiz query hooks — TanStack Query wrappers for Tauri commands
 * All data flows: React → invoke() → Rust → SQLite → Rust → React
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { z } from 'zod'
import { QuizSummarySchema, QuizSchema, type Quiz } from '@quizforge/types'

// ─── Query Keys ───

export const quizKeys = {
    all: ['quizzes'] as const,
    detail: (id: string) => ['quizzes', id] as const,
    questions: (quizId: string) => ['quizzes', quizId, 'questions'] as const,
    results: (quizId: string) => ['quizzes', quizId, 'results'] as const,
}

// ─── Queries ───

export function useQuizzes() {
    return useQuery({
        queryKey: quizKeys.all,
        queryFn: async () => {
            const raw = await invoke<unknown[]>('get_all_quizzes')
            return z.array(QuizSummarySchema).parse(raw)
        },
    })
}

export function useQuiz(id: string) {
    return useQuery({
        queryKey: quizKeys.detail(id),
        queryFn: async () => {
            const raw = await invoke<unknown>('get_quiz', { id })
            return QuizSchema.parse(raw)
        },
        enabled: !!id,
    })
}

// ─── Mutations ───

export function useCreateQuiz() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (data: { title: string, author?: string }) => {
            const raw = await invoke<unknown>('create_quiz', { dto: data })
            // Use safeParse — if full schema fails (e.g. old DB records), fall back to just id
            const result = QuizSchema.safeParse(raw)
            if (result.success) return result.data
            // Partial fallback: just need the id to navigate; editor will load full data
            const idOnly = z.object({ id: z.string() }).safeParse(raw)
            if (idOnly.success) return { id: idOnly.data.id } as Quiz
            throw new Error('Không tạo được quiz: ' + result.error.issues.map(i => i.message).join(', '))
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quizKeys.all })
        },
    })
}

export function useUpdateQuiz(id: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (data: Partial<Quiz>) => {
            const raw = await invoke<unknown>('update_quiz', { id, dto: data })
            return QuizSchema.parse(raw)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quizKeys.detail(id) })
            qc.invalidateQueries({ queryKey: quizKeys.all })
        },
    })
}

export function useDeleteQuiz() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await invoke('delete_quiz', { id })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quizKeys.all })
        },
    })
}

export function useDuplicateQuiz() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const raw = await invoke<unknown>('duplicate_quiz', { id })
            return QuizSchema.parse(raw)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quizKeys.all })
        },
    })
}

export function useExportQuizFile() {
    return useMutation({
        mutationFn: async ({ quizId, exportPath }: { quizId: string; exportPath: string }) => {
            await invoke('export_quiz_to_qfz', { quizId, exportPath })
        },
    })
}

export function useImportQuizFile() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (qfzPath: string) => {
            const raw = await invoke<unknown>('import_quiz_from_qfz', { qfzPath })
            return QuizSchema.parse(raw)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quizKeys.all })
        },
    })
}

// ─── Excel Import ───

export interface ExcelImportResult {
    quizId: string
    imported: number
    total: number
    errors: string[]
    totalPoints: number
    title: string
}

export function useGenerateImportTemplate() {
    return useMutation({
        mutationFn: async (outputPath: string) => {
            await invoke('generate_import_template', { outputPath })
        },
    })
}

export function useImportQuizFromExcel() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ filePath, quizTitle }: { filePath: string; quizTitle: string }) => {
            const raw = await invoke<ExcelImportResult>('import_quiz_from_excel', { filePath, quizTitle })
            return raw
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quizKeys.all })
        },
    })
}

export function useExportPlayerExe() {
    return useMutation({
        mutationFn: async (params: {
            quiz: any
            students: any
            outputDir: string
        }) => {
            return await invoke('prepare_player_bundle', params)
        },
    })
}
