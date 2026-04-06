import type { AuthTokens } from '../types/tesla'

const TOKENS_KEY = 'tesla-tokens'
const PKCE_VERIFIER_KEY = 'tesla-pkce-verifier'
const AUTH_STATE_KEY = 'tesla-auth-state'

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
}

export function getTokens(): AuthTokens | null {
  const raw = localStorage.getItem(TOKENS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthTokens
  } catch {
    return null
  }
}

export function clearTokens(): void {
  localStorage.removeItem(TOKENS_KEY)
}

export function savePKCEVerifier(verifier: string): void {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
}

export function getPKCEVerifier(): string | null {
  return sessionStorage.getItem(PKCE_VERIFIER_KEY)
}

export function clearPKCEVerifier(): void {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY)
}

export function saveAuthState(state: string): void {
  sessionStorage.setItem(AUTH_STATE_KEY, state)
}

export function getAuthState(): string | null {
  return sessionStorage.getItem(AUTH_STATE_KEY)
}

export function clearAuthState(): void {
  sessionStorage.removeItem(AUTH_STATE_KEY)
}
