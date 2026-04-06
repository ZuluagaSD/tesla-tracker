import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthTokens } from '../types/tesla'
import { generatePKCEPair } from './pkce'
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  extractCodeFromCallbackUrl,
} from './tesla-auth'
import {
  saveTokens,
  getTokens,
  clearTokens,
  savePKCEVerifier,
  getPKCEVerifier,
  clearPKCEVerifier,
  saveAuthState,
  getAuthState,
  clearAuthState,
} from '../utils/storage'

interface AuthContextValue {
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  awaitingCallback: boolean
  authUrl: string | null
  login: () => Promise<void>
  handleCallback: (url: string) => Promise<void>
  logout: () => void
  getAccessToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [awaitingCallback, setAwaitingCallback] = useState(false)
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  useEffect(() => {
    const stored = getTokens()
    if (stored && stored.expires_at > Date.now()) {
      setTokens(stored)
    } else if (stored) {
      clearTokens()
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async () => {
    const { code_verifier, code_challenge } = await generatePKCEPair()
    savePKCEVerifier(code_verifier)

    const state = base64UrlRandom()
    saveAuthState(state)

    const url = buildAuthUrl(state, code_challenge)
    setAuthUrl(url)
    setAwaitingCallback(true)
    window.open(url, '_blank')
  }, [])

  const handleCallback = useCallback(async (callbackUrl: string) => {
    const extracted = extractCodeFromCallbackUrl(callbackUrl)
    if (!extracted) throw new Error('Invalid callback URL. Make sure you copied the full URL.')

    const storedState = getAuthState()
    if (extracted.state !== storedState) {
      throw new Error('State mismatch. Please try signing in again.')
    }

    const verifier = getPKCEVerifier()
    if (!verifier) throw new Error('Missing PKCE verifier. Please try signing in again.')

    const newTokens = await exchangeCodeForTokens(extracted.code, verifier)
    saveTokens(newTokens)
    setTokens(newTokens)
    setAwaitingCallback(false)
    setAuthUrl(null)

    clearPKCEVerifier()
    clearAuthState()
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setTokens(null)
    setAwaitingCallback(false)
    setAuthUrl(null)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!tokens) throw new Error('Not authenticated')

    // Refresh if expiring within 5 minutes
    if (tokens.expires_at - Date.now() < 5 * 60 * 1000) {
      try {
        const newTokens = await refreshAccessToken(tokens.refresh_token)
        saveTokens(newTokens)
        setTokens(newTokens)
        return newTokens.access_token
      } catch {
        logout()
        throw new Error('Session expired. Please sign in again.')
      }
    }

    return tokens.access_token
  }, [tokens, logout])

  return (
    <AuthContext.Provider
      value={{
        tokens,
        isAuthenticated: !!tokens,
        isLoading,
        awaitingCallback,
        authUrl,
        login,
        handleCallback,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function base64UrlRandom(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
