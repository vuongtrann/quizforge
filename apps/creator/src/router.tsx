import {
    createRouter,
    createRoute,
    createRootRoute,
} from '@tanstack/react-router'
import { WelcomeScreen } from './pages/WelcomeScreen'
import { Dashboard } from './pages/Dashboard'
import { QuizEditor } from './pages/QuizEditor'
import { PlayerPage } from './pages/PlayerPage'
import { Settings } from './pages/Settings'
import { ReceiveMode } from './pages/ReceiveMode'

// Root route — app shell
const rootRoute = createRootRoute()

// / → Welcome Screen
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: WelcomeScreen,
})

// /dashboard → Dashboard (quiz list + monitor tabs)
const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: Dashboard,
})

// /quiz/$quizId → Quiz Editor
const quizEditorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/quiz/$quizId',
    component: QuizEditor,
})

// /settings → App Settings
const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: Settings,
})

// /receive → LAN Receiver Mode
const receiveRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/receive',
    component: ReceiveMode,
})

// /preview/$quizId → Quiz Player
const previewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/preview/$quizId',
    component: PlayerPage,
})

// Build route tree
const routeTree = rootRoute.addChildren([
    indexRoute,
    dashboardRoute,
    quizEditorRoute,
    previewRoute,
    settingsRoute,
    receiveRoute,
])

// Create router
export const router = createRouter({ routeTree })

// Register router for type-safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
