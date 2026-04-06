import type { ReactNode } from 'react'
import { useAuth } from '../auth/auth-context'

export function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-lg">
              <svg viewBox="0 0 278 100" className="w-5 h-5 text-white fill-current">
                <path d="M139 0C96.3 0 78.7 28.6 78.7 28.6h120.6S181.7 0 139 0zm0 33.3c-18.8 0-34.1 2.8-46.9 7.1L139 100l46.9-59.6c-12.8-4.3-28.1-7.1-46.9-7.1z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">Tesla Delivery Tracker</h1>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
