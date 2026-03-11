import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { Question } from '@quizforge/types'
import { quizKeys } from './useQuizzes'

export function useAddQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ quizId, question }: { quizId: string; question: Question }) => {
            return await invoke<Question>('add_question', { quizId, question })
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: quizKeys.detail(variables.quizId) })
        }
    })
}

export function useUpdateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ quizId: _quizId, question }: { quizId: string; question: Question }) => {
            return await invoke<Question>('update_question', { id: question.id, question })
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: quizKeys.detail(variables.quizId) })
        }
    })
}

export function useDeleteQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ quizId: _quizId, questionId }: { quizId: string; questionId: string }) => {
            return await invoke<void>('delete_question', { id: questionId })
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: quizKeys.detail(variables.quizId) })
        }
    })
}

export function useDuplicateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ quizId: _quizId, questionId }: { quizId: string; questionId: string }) => {
            return await invoke<unknown>('duplicate_question', { id: questionId })
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: quizKeys.detail(variables.quizId) })
        }
    })
}
