import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md w-full text-center space-y-4 bg-white rounded-[2rem] shadow-2xl p-12">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Đã xảy ra lỗi</h2>
            <p className="text-xs text-slate-500 font-mono break-all bg-red-50 rounded-xl px-4 py-3">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
