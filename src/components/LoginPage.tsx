import { useState } from 'react'
import { useAuth } from '../auth/auth-context'
import { useI18n } from '../lib/i18n'

export function LoginPage() {
  const { login, handleCallback, awaitingCallback, authUrl } = useAuth()
  const { lang, setLang, t } = useI18n()
  const [callbackUrl, setCallbackUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onLogin() {
    setError(null)
    try {
      await login()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.error.start'))
    }
  }

  async function onSubmitCallback(e: React.FormEvent) {
    e.preventDefault()
    if (!callbackUrl.trim()) return

    setError(null)
    setSubmitting(true)
    try {
      await handleCallback(callbackUrl.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error.complete'))
    } finally {
      setSubmitting(false)
    }
  }

  function onCancel() {
    setCallbackUrl('')
    setError(null)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4">
            <svg viewBox="0 0 278 100" className="w-10 h-10 text-white fill-current">
              <path d="M139 0C96.3 0 78.7 28.6 78.7 28.6h120.6S181.7 0 139 0zm0 33.3c-18.8 0-34.1 2.8-46.9 7.1L139 100l46.9-59.6c-12.8-4.3-28.1-7.1-46.9-7.1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('app.title')}</h1>
          <p className="text-gray-400 mt-2">{t('app.subtitle')}</p>
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="mt-3 text-sm text-gray-500 hover:text-white transition-colors"
          >
            {lang === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {!awaitingCallback ? (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">{t('login.description')}</p>
              <button
                onClick={onLogin}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                {t('login.signIn')}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmitCallback} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full text-xs font-medium">1</span>
                  {t('login.step1')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full text-xs font-medium">2</span>
                  {t('login.step2')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex items-center justify-center w-6 h-6 bg-gray-800 rounded-full text-xs font-medium">3</span>
                  {t('login.step3')}
                </div>
              </div>

              <input
                type="text"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder={t('login.placeholder')}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  {t('login.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !callbackUrl.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  {submitting ? t('login.submitting') : t('login.submit')}
                </button>
              </div>

              {authUrl && (
                <p className="text-xs text-gray-500 text-center">
                  {t('login.popupBlocked')}{' '}
                  <a href={authUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">
                    {t('login.openManually')}
                  </a>
                </p>
              )}
            </form>
          )}

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
