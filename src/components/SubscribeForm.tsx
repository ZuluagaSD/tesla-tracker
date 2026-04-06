import { useState, useEffect } from 'react'
import { useAuth } from '../auth/auth-context'

const STORAGE_KEY = 'tesla-tracker-subscription'

export function SubscribeForm() {
  const { tokens } = useAuth()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setSubscribed(stored)
  }, [])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !tokens) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          token_expires_at: tokens.expires_at,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Subscription failed' })
        return
      }

      localStorage.setItem(STORAGE_KEY, email.trim())
      setSubscribed(email.trim())
      setMessage({ type: 'success', text: data.message ?? 'Subscribed!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    if (!subscribed) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribed }),
      })

      if (!res.ok) {
        setMessage({ type: 'error', text: 'Failed to unsubscribe' })
        return
      }

      localStorage.removeItem(STORAGE_KEY)
      setSubscribed(null)
      setEmail('')
      setMessage({ type: 'success', text: 'Unsubscribed successfully' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to unsubscribe' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-medium text-sm">Email Notifications</h3>
          <p className="text-gray-500 text-xs">Get notified when your order status changes</p>
        </div>
      </div>

      {subscribed ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-2.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-green-300 text-sm">Subscribed: {subscribed}</span>
          </div>
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            {loading ? 'Subscribing...' : 'Notify Me'}
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-3 text-sm rounded-xl px-4 py-2.5 ${
          message.type === 'success'
            ? 'bg-green-900/20 border border-green-800/30 text-green-300'
            : 'bg-red-900/20 border border-red-800/30 text-red-300'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
