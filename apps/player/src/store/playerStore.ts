import { create } from 'zustand'
import { produce } from 'immer'
import { invoke } from '@tauri-apps/api/core'
import { save, ask } from '@tauri-apps/plugin-dialog'
import { isQuestionAnswered } from '@quizforge/quiz-engine'

// ─── Fisher-Yates shuffle (in-place, returns same array) ────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type Phase = 'password' | 'details' | 'intro' | 'quiz' | 'reviewing' | 'result'

// ─── Domain types (mirror what Creator exports via quiz.dat) ───────────────────

export interface QuizQuestion {
  id: string
  type: string
  text: string
  richText?: string
  mediaId?: string
  media?: { id: string; type: 'image' | 'audio' | 'video'; filename: string; mimeType: string; data: string; width?: number; height?: number } | null
  points: { correct: number; incorrect: number }
  feedback: { correct: string; incorrect: string }
  attempts?: number
  group?: string | null
  timeLimit?: number
  autoNext?: boolean
  // type-specific (all optional — populated depending on type)
  options?: Array<{ id: string; text: string; label?: string }>
  pairs?: Array<{ id: string; choice: string; match: string }>
  items?: Array<{ id: string; text: string; correctOrder: number }>
  words?: Array<{ id: string; text: string; isDistractor: boolean }>
  blanks?: Array<{ id: string; position: number; acceptableAnswers: string[]; caseSensitive: boolean }>
  templateText?: string
  hotspots?: Array<{ id: string; shape: string; coords: number[]; isCorrect: boolean }>
  imageMediaId?: string
  minWords?: number
  maxWords?: number
  allowMultipleClicks?: boolean
  wordAnswers?: Record<string, string>
}

export interface QuizDisplayData {
  id: string
  title: string
  totalPoints?: number
  questions: QuizQuestion[]
  settings?: {
    passingRate?: number
    timeLimit?: number
    shuffleQuestions?: boolean
    allowNavigation?: boolean
    randomization?: {
      randomizeQuestions?: boolean
      randomizeOptions?: boolean
      randomCount?: number
    }
    submission?: {
      mode: 'per_question' | 'all_at_once'
      showCorrectAfterSubmit?: boolean
      allowReview?: boolean
      oneAttemptOnly?: boolean
      promptResume?: boolean
    }
    result?: {
      passMessage?: string
      failMessage?: string
      showStatisticsOnResult?: boolean
      finishButton?: {
        show?: boolean
        passUrl?: string
        failUrl?: string
        openInCurrentWindow?: boolean
      }
    }
    lockdown?: { enabled?: boolean }
    email?: {
      sendResultsToUser?: boolean
      sendResultsToAdmin?: boolean
      adminEmail?: string
    }
    meta?: {
      title?: string
      description?: string
      keywords?: string
    }
  }
  security?: {
    protection?: 'open' | 'password' | 'user_id_password' | string
    password?: string
  }
  information?: {
    introduction?: { enabled: boolean; title?: string; content?: string }
    author?: string
    description?: string
    [key: string]: any
  }
  theme?: Record<string, unknown>
  resultSettings?: {
    passMessage?: string
    failMessage?: string
    finishButton?: { passUrl?: string; failUrl?: string }
  }
}

export interface Student {
  id: string
  studentId?: string
  name: string
  className?: string
  class?: string
  email?: string
}

// ─── Store types ───────────────────────────────────────────────────────────────

interface ValidationResult {
  is_correct: boolean
  points_earned: number
  correct_feedback?: string
  incorrect_feedback?: string
}

interface QuestionResult {
  is_correct: boolean
  points_earned: number
  time_taken_ms: number
}

interface PlayerState {
  // Data
  quiz: QuizDisplayData | null
  students: Student[]

  // Session
  phase: Phase
  selectedStudent: Student | null
  currentQuestionIndex: number
  answers: Record<string, unknown>
  questionResults: Record<string, QuestionResult>
  startTime: number | null
  questionStartTime: number | null

  // UI
  outlinePanelOpen: boolean
  feedbackVisible: boolean
  lastValidationResult: ValidationResult | null
  isSubmitting: boolean
  violationCount: number

  // Timer
  timeRemaining: number | null  // seconds remaining, null = no limit
  timerExpired: boolean
  questionTimeRemaining: number | null
  questionTimerExpired: boolean
  isFinished: boolean
  isResumed: boolean

  // Actions
  setQuiz: (quiz: QuizDisplayData) => void
  setStudents: (students: Student[]) => void
  selectStudent: (student: Student) => void
  startQuiz: () => void
  setAnswer: (questionId: string, answer: unknown) => void
  nextQuestion: () => void
  prevQuestion: () => void
  jumpToQuestion: (index: number) => void
  toggleOutline: () => void
  setPhase: (phase: Phase) => void
  setLockdownWarning: (active: boolean) => void
  incrementViolation: () => void
  submitAnswer: () => Promise<void>
  submitAllAtOnce: () => Promise<void>
  finishQuiz: () => Promise<void>
  startReview: () => void
  endReview: () => void
  initTimer: () => void
  tickTimer: () => void
  initQuestionTimer: () => void
  loadPersistedState: () => Promise<void>
  clearPersistedState: () => Promise<void>
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  quiz: null,
  students: [],
  phase: 'intro',
  selectedStudent: null,
  currentQuestionIndex: 0,
  answers: {},
  questionResults: {},
  startTime: null,
  questionStartTime: null,
  outlinePanelOpen: false,
  feedbackVisible: false,
  lastValidationResult: null,
  isSubmitting: false,
  violationCount: 0,
  timeRemaining: null,
  timerExpired: false,
  questionTimeRemaining: null,
  questionTimerExpired: false,
  isFinished: false,
  isResumed: false,

  setQuiz: (quiz) => {
    // Determine initial phase based on settings
    let initialPhase: Phase = 'intro'
    if (quiz.security?.protection === 'password') {
      initialPhase = 'password'
    } else if (quiz.information?.introduction?.enabled) {
      initialPhase = 'details' // Re-using details as the info screen
    }
    set({ quiz, phase: initialPhase })
  },
  setStudents: (students) => set({ students }),
  selectStudent: (student) => set({ selectedStudent: student }),

  startQuiz: () => {
    const { quiz } = get()

    // ── Shuffle logic ─────────────────────────────────────────────────
    if (quiz) {
      const randomization = quiz.settings?.randomization
      const shouldShuffleQuestions = randomization?.randomizeQuestions ?? quiz.settings?.shuffleQuestions ?? false
      const shouldShuffleOptions = randomization?.randomizeOptions ?? false

      if (shouldShuffleQuestions || shouldShuffleOptions) {
        const shuffledQuestions = [...quiz.questions]

        // Shuffle question order
        if (shouldShuffleQuestions) {
          shuffleArray(shuffledQuestions)

          // Apply Random N subset if specified
          const randomCount = randomization?.randomCount
          if (randomCount && randomCount > 0 && randomCount < shuffledQuestions.length) {
            shuffledQuestions.splice(randomCount)
          }
        }

        // Shuffle per-question options/items
        if (shouldShuffleOptions) {
          for (const q of shuffledQuestions) {
            switch (q.type) {
              case 'multiple_choice':
              case 'multiple_response':
                if (q.options) q.options = shuffleArray([...q.options])
                break
              case 'matching':
                // Shuffle the right-side (match) column, keep left-side (choice) intact
                if (q.pairs) {
                  const matches = q.pairs.map(p => p.match)
                  shuffleArray(matches)
                  q.pairs = q.pairs.map((p, i) => ({ ...p, match: matches[i] }))
                }
                break
              case 'sequence':
                // HS must reorder, so shuffle items (this IS the question)
                if (q.items) q.items = shuffleArray([...q.items])
                break
              case 'word_bank':
                // Shuffle word pool
                if (q.words) q.words = shuffleArray([...q.words])
                break
              // true_false: only 2 fixed options, no shuffle
              // fill_in_blank, short_essay, click_map, blank_page: no options to shuffle
              default:
                break
            }
          }
        }

        // Apply shuffled questions to quiz
        set({ quiz: { ...quiz, questions: shuffledQuestions } })
      }
    }

    set({
      phase: 'quiz',
      startTime: Date.now(),
      questionStartTime: Date.now(),
    })
    get().initTimer()
    get().initQuestionTimer()
  },

  initTimer: () => {
    const { quiz } = get()
    const timeLimitMinutes = quiz?.settings?.timeLimit
    if (timeLimitMinutes && timeLimitMinutes > 0) {
      set({ timeRemaining: timeLimitMinutes * 60, timerExpired: false })
    } else {
      set({ timeRemaining: null, timerExpired: false })
    }
  },

  tickTimer: () => {
    const { timeRemaining, questionTimeRemaining, finishQuiz, nextQuestion, quiz, currentQuestionIndex } = get()

    // ── Global Timer ──
    if (timeRemaining !== null) {
      if (timeRemaining <= 1) {
        set({ timeRemaining: 0, timerExpired: true })
        void finishQuiz()
      } else {
        set({ timeRemaining: timeRemaining - 1 })
      }
    }

    // ── Per-Question Timer ──
    if (questionTimeRemaining !== null) {
      if (questionTimeRemaining <= 1) {
        set({ questionTimeRemaining: 0, questionTimerExpired: true })
        const question = quiz?.questions?.[currentQuestionIndex]
        if (question?.autoNext) {
          nextQuestion()
        }
      } else {
        set({ questionTimeRemaining: questionTimeRemaining - 1 })
      }
    }
  },

  initQuestionTimer: () => {
    const { quiz, currentQuestionIndex } = get()
    const question = quiz?.questions?.[currentQuestionIndex]
    const limit = question?.timeLimit
    if (limit && limit > 0) {
      set({ questionTimeRemaining: limit, questionTimerExpired: false })
    } else {
      set({ questionTimeRemaining: null, questionTimerExpired: false })
    }
  },

  setAnswer: (questionId, answer) => set(
    produce((state: PlayerState) => {
      state.answers[questionId] = answer
    })
  ),

  nextQuestion: () => set((state) => ({
    currentQuestionIndex: Math.min(
      state.currentQuestionIndex + 1,
      (state.quiz?.questions?.length ?? 1) - 1
    ),
    questionStartTime: Date.now(),
    feedbackVisible: false,
  })),

  prevQuestion: () => set((state) => ({
    currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    questionStartTime: Date.now(),
    feedbackVisible: false,
  })),

  jumpToQuestion: (index) => {
    set({
      currentQuestionIndex: index,
      questionStartTime: Date.now(),
      feedbackVisible: false,
    })
    get().initQuestionTimer()
  },

  toggleOutline: () => set((state) => ({ outlinePanelOpen: !state.outlinePanelOpen })),
  setPhase: (phase) => set({ phase }),
  setLockdownWarning: (active) => set({ feedbackVisible: active }),
  incrementViolation: () => set((state) => ({ violationCount: state.violationCount + 1 })),

  submitAnswer: async () => {
    const state = get()
    const question = state.quiz?.questions?.[state.currentQuestionIndex]
    if (!question) return

    const answer = state.answers[question.id]
    const timeTakenMs = state.questionStartTime ? Date.now() - state.questionStartTime : 0

    set({ isSubmitting: true })
    try {
      // Pass the raw answer value (not stringified) — Tauri handles serialization
      const result = await invoke<ValidationResult>('validate_answer', {
        questionId: question.id,
        answer: answer ?? null,
      })

      set(produce((draft: PlayerState) => {
        draft.feedbackVisible = true
        draft.lastValidationResult = result
        draft.isSubmitting = false
        draft.questionResults[question.id] = {
          is_correct: result.is_correct,
          points_earned: result.points_earned,
          time_taken_ms: timeTakenMs,
        }
      }))
    } catch (err) {
      console.error('[submitAnswer] invoke failed:', err)
      set(produce((draft: PlayerState) => {
        draft.feedbackVisible = true
        draft.isSubmitting = false
        draft.lastValidationResult = { is_correct: false, points_earned: 0 }
      }))
    }
  },

  submitAllAtOnce: async () => {
    const state = get()
    const { quiz } = state
    if (!quiz) return

    const gradable = quiz.questions.filter(q => q.type !== 'blank_page')
    const unansweredCount = gradable.filter(q => !isQuestionAnswered(q as any, state.answers[q.id])).length

    if (unansweredCount > 0) {
      const confirmed = await ask(`Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`, {
        title: 'Xác nhận nộp bài',
        kind: 'warning'
      })
      if (!confirmed) return
    }

    set({ isSubmitting: true })

    try {
      // Validate all answered questions in sequence
      for (const q of gradable) {
        const answer = state.answers[q.id]
        try {
          const result = await invoke<ValidationResult>('validate_answer', {
            questionId: q.id,
            answer: answer ?? null,
          })
          set(produce((draft: PlayerState) => {
            draft.questionResults[q.id] = {
              is_correct: result.is_correct,
              points_earned: result.points_earned,
              time_taken_ms: 0,
            }
          }))
        } catch {
          set(produce((draft: PlayerState) => {
            draft.questionResults[q.id] = {
              is_correct: false,
              points_earned: 0,
              time_taken_ms: 0,
            }
          }))
        }
      }

      set({ isSubmitting: false })
      await get().finishQuiz()
    } catch (err) {
      console.error('[submitAllAtOnce] failed:', err)
      set({ isSubmitting: false })
    }
  },

  loadPersistedState: async () => {
    const persisted = await invoke<any>('load_quiz_state')
    if (persisted && persisted.quizId === get().quiz?.id) {
      const { answers, currentQuestionIndex, phase, selectedStudent, isFinished, questionResults, startTime, timeRemaining } = persisted

      // If oneAttemptOnly is true and it's finished, we should probably block or just show results
      if (isFinished && get().quiz?.settings?.submission?.oneAttemptOnly) {
        set({ answers, currentQuestionIndex, phase: 'result', selectedStudent, isFinished, questionResults, startTime, timeRemaining, isResumed: true })
        return
      }

      if (get().quiz?.settings?.submission?.promptResume) {
        const resume = await ask('Bạn có muốn tiếp tục bài thi đang dở không?', { title: 'Tiếp tục bài thi', kind: 'info' })
        if (resume) {
          set({ answers, currentQuestionIndex, phase, selectedStudent, isFinished, questionResults, startTime, timeRemaining, isResumed: true })
          if (timeRemaining) get().initTimer() // simple restart for now or use the saved value
          get().initQuestionTimer()
        } else {
          await invoke('clear_quiz_state')
        }
      }
    }
  },

  clearPersistedState: async () => {
    await invoke('clear_quiz_state')
  },

  finishQuiz: async () => {
    const state = get()
    const { quiz, selectedStudent, questionResults, startTime, answers, violationCount } = state
    if (!quiz) { set({ phase: 'result' }); return }

    set({ isFinished: true })
    await invoke('save_quiz_state', {
      quizId: quiz.id,
      answers,
      currentQuestionIndex: state.currentQuestionIndex,
      phase: 'result',
      selectedStudent,
      isFinished: true,
      questionResults,
      startTime,
      timeRemaining: state.timeRemaining,
    })

    const gradableQuestions = quiz.questions.filter(q => q.type !== 'blank_page')
    const totalPoints = gradableQuestions.reduce((sum, q) => sum + (q.points?.correct ?? 0), 0)
    const earnedPoints = Object.values(questionResults).reduce((sum, r) => sum + r.points_earned, 0)
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passingRate = quiz.settings?.passingRate ?? 80
    const passed = percentage >= passingRate

    const resultPayload = {
      quiz_id: quiz.id,
      student_id: selectedStudent?.id ?? '',
      student_name: selectedStudent?.name ?? 'Ẩn danh',
      student_class: selectedStudent?.class ?? '',
      start_time: startTime,
      end_time: Date.now(),
      answers,
      results: questionResults,
      violations: violationCount,
      score: earnedPoints,
      max_score: totalPoints,
      passed,
      time_taken_seconds: Math.round((Date.now() - (startTime || Date.now())) / 1000)
    }

    set({ isSubmitting: true, isFinished: true })

    // 1. Get Machine ID
    let machineId = ''
    try {
      machineId = await invoke('get_machine_id')
    } catch (e) {
      console.error('Failed to get machine Id:', e)
    }

    const payload = {
      ...resultPayload,
      quizTitle: quiz.title,
      quiz_title: quiz.title,
      machineId,
      machine_id: machineId,
      startedAt: new Date(startTime || Date.now()).toISOString(),
      completedAt: new Date().toISOString(),
      totalPoints: resultPayload.max_score,
      earnedPoints: resultPayload.score,
      // studentName, studentId already in resultPayload
    }

    let submittedSuccessfully = false

    // 2. Discover LAN Servers
    try {
      console.log('Discovering LAN servers...')
      const servers = await invoke<string[]>('discover_lan_server')
      console.log('Found servers:', servers)

      if (servers.length > 0) {
        for (const serverAddr of servers) {
          try {
            const url = `http://${serverAddr}/result`
            console.log(`Attempting to submit to ${url}...`)
            const response = await invoke<string>('send_result_http', { url, result: payload })
            if (response === 'Success') {
              console.log('Successfully submitted result to LAN server')
              submittedSuccessfully = true
              break
            }
          } catch (e) {
            console.error(`Failed to submit to server ${serverAddr}:`, e)
          }
        }
      }
    } catch (e) {
      console.error('LAN discovery failed:', e)
    }

    // 3. Fallback to .qfr if LAN failed
    if (!submittedSuccessfully) {
      const confirmed = await ask(
        'Không thể nộp bài qua LAN. Bạn có muốn lưu kết quả ra file (.qfr) để nộp thủ công không?',
        { title: 'Lỗi nộp bài', kind: 'warning' }
      )

      if (confirmed) {
        try {
          const filePath = await save({
            filters: [{ name: 'Quiz Result', extensions: ['qfr'] }],
            defaultPath: `${selectedStudent?.name || 'Student'}_${quiz.title || 'Result'}.qfr`
          })
          if (filePath) {
            await invoke('save_result_to_qfr', {
              result: { ...payload, machine_id: machineId }, // Ensure snake_case for the file payload if expected by import command
              savePath: filePath
            })
            submittedSuccessfully = true
          }
        } catch (e) {
          console.error('Failed to save .qfr fallback:', e)
        }
      }
    }

    set({ isSubmitting: false, phase: 'result' })
  },

  startReview: () => set({ phase: 'reviewing', currentQuestionIndex: 0 }),
  endReview: () => set({ phase: 'result' }),
}))

// ─── Auto-save subscription ───────────────────────────────────────────────
usePlayerStore.subscribe((state, prevState) => {
  // Only save if phase is 'quiz' and something sensitive changed
  if (state.phase === 'quiz' && (
    state.answers !== prevState.answers ||
    state.currentQuestionIndex !== prevState.currentQuestionIndex ||
    state.timeRemaining !== prevState.timeRemaining
  )) {
    invoke('save_quiz_state', {
      quizId: state.quiz?.id,
      answers: state.answers,
      currentQuestionIndex: state.currentQuestionIndex,
      phase: state.phase,
      selectedStudent: state.selectedStudent,
      isFinished: state.isFinished,
      questionResults: state.questionResults,
      startTime: state.startTime,
      timeRemaining: state.timeRemaining,
    }).catch(console.error)
  }
})
