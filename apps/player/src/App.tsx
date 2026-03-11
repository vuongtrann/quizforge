import { useEffect, useState } from 'react'
import { usePlayerStore } from './store/playerStore'
import { StudentSelector } from './components/StudentSelector'
import { PasswordScreen } from './components/PasswordScreen'
import { DetailsScreen } from './components/DetailsScreen'
import { QuizPlayer } from './components/QuizPlayer'
import { ResultScreen } from './components/ResultScreen'
import { LockdownOverlay } from './components/LockdownOverlay'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { listen } from '@tauri-apps/api/event'
import { ask } from '@tauri-apps/plugin-dialog'
import { Loader2, AlertCircle } from 'lucide-react'
import type { QuizDisplayData, Student } from './store/playerStore'

function App() {
  const { phase, setQuiz, setStudents, quiz, setLockdownWarning, incrementViolation } = usePlayerStore()
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBundle() {
      try {
        const quizData = await invoke<QuizDisplayData>('load_quiz_data')
        const studentsData = await invoke<Student[]>('get_students')
        setQuiz(quizData)
        setStudents(Array.isArray(studentsData) ? studentsData : [])

        // Load persisted state (Resume/Attempt limit)
        await usePlayerStore.getState().loadPersistedState()

        // ── Set Window Title ──────────────────────────────────────────────
        const windowTitle = quizData.settings?.meta?.title || quizData.title || 'QuizForge Player'
        getCurrentWindow().setTitle(windowTitle).catch(console.error)

        // ── Apply Theme CSS Variables ─────────────────────────────────────
        const theme = quizData.theme as Record<string, any> | undefined
        if (theme) {
          const root = document.documentElement
          if (theme.primaryColor) root.style.setProperty('--qf-primary', theme.primaryColor)
          if (theme.backgroundColor) root.style.setProperty('--qf-bg', theme.backgroundColor)
          if (theme.textColor) root.style.setProperty('--qf-text', theme.textColor)
          if (theme.fontFamily) root.style.setProperty('--qf-font', theme.fontFamily)

          // Apply rounded corners preference
          const radius = theme.roundedCorners ? '1rem' : '0.25rem'
          root.style.setProperty('--qf-radius', radius)

          // Generate a lighter variant for backgrounds (e.g. 10% opacity)
          if (theme.primaryColor) {
            root.style.setProperty('--qf-primary-light', `${theme.primaryColor}1a`) // ~10% opacity hex
          }
        }
      } catch (err) {
        setLoadError(String(err))
      }
    }
    loadBundle()

    const unlistenBlur = getCurrentWindow().listen('tauri:blur', () => {
      if (usePlayerStore.getState().phase === 'quiz') {
        setLockdownWarning(true)
        incrementViolation()
      }
    })

    const unlistenClose = listen('close-requested', async () => {
      const currentPhase = usePlayerStore.getState().phase
      if (currentPhase === 'quiz') {
        const confirmed = await ask('Kết quả chưa gửi. Bạn có muốn thoát không?', { title: 'Xác nhận thoát', kind: 'warning' })
        if (confirmed) {
          void invoke('force_quit')
        }
      } else {
        void invoke('force_quit')
      }
    })

    return () => {
      unlistenBlur.then(fn => fn())
      unlistenClose.then(fn => fn())
    }
  }, [setQuiz, setStudents, setLockdownWarning, incrementViolation])

  if (loadError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md w-full text-center space-y-6 bg-white rounded-[2rem] shadow-2xl p-12">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
              Không tải được bài thi
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Đặt file{' '}
              <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs text-brand-700">
                quiz.dat
              </code>{' '}
              vào cùng thư mục với ứng dụng rồi mở lại.
            </p>
          </div>
          <p className="text-[11px] text-red-400 font-mono break-all bg-red-50 rounded-xl px-4 py-3">
            {loadError}
          </p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Đang tải dữ liệu bài thi...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-white select-none">
      {phase === 'password' && <PasswordScreen />}
      {phase === 'details' && <DetailsScreen />}
      {phase === 'intro' && <StudentSelector />}
      {phase === 'quiz' && <QuizPlayer />}
      {phase === 'result' && <ResultScreen />}
      <LockdownOverlay />
    </div>
  )
}

export default App
