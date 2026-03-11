import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Detect OS and inject data-platform on <html> before React renders
;(function applyPlatformTokens() {
  const ua = navigator.userAgent
  const platform = ua.includes('Windows') ? 'windows' : ua.includes('Mac') ? 'macos' : 'linux'
  document.documentElement.setAttribute('data-platform', platform)
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-scheme', 'dark')
  }
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
