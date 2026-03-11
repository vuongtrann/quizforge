import { create } from 'zustand'

interface AppState {
    // Current view
    currentView: 'welcome' | 'dashboard' | 'editor'
    setCurrentView: (view: AppState['currentView']) => void

    // Dashboard
    dashboardTab: 'quizzes' | 'monitor'
    setDashboardTab: (tab: AppState['dashboardTab']) => void
    quizViewMode: 'grid' | 'list'
    setQuizViewMode: (mode: AppState['quizViewMode']) => void
    searchQuery: string
    setSearchQuery: (query: string) => void

    // Monitor
    isMonitorActive: boolean
    setMonitorActive: (active: boolean) => void

    // Editor state
    currentQuizId: string | null
    setCurrentQuizId: (id: string | null) => void
    hasUnsavedChanges: boolean
    setHasUnsavedChanges: (unsaved: boolean) => void

    // Dialogs
    activeDialog: string | null
    openDialog: (dialogId: string) => void
    closeDialog: () => void
}

export const useAppStore = create<AppState>((set) => ({
    // Current view
    currentView: 'welcome',
    setCurrentView: (view) => set({ currentView: view }),

    // Dashboard
    dashboardTab: 'quizzes',
    setDashboardTab: (tab) => set({ dashboardTab: tab }),
    quizViewMode: 'grid',
    setQuizViewMode: (mode) => set({ quizViewMode: mode }),
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Monitor
    isMonitorActive: false,
    setMonitorActive: (active) => set({ isMonitorActive: active }),

    // Editor
    currentQuizId: null,
    setCurrentQuizId: (id) => set({ currentQuizId: id }),
    hasUnsavedChanges: false,
    setHasUnsavedChanges: (unsaved) => set({ hasUnsavedChanges: unsaved }),

    // Dialogs
    activeDialog: null,
    openDialog: (dialogId) => set({ activeDialog: dialogId }),
    closeDialog: () => set({ activeDialog: null }),
}))
