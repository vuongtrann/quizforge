import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,    // 5 minutes
            gcTime: 1000 * 60 * 30,      // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,  // Desktop app — no need
        },
        mutations: {
            onError: (error) => {
                // Global error handler — will be replaced with toast
                console.error('Mutation error:', error)
            },
        },
    },
})
