import type { AuthTokens } from '../types/tesla'

const TESLA_AUTH_URL = 'https://auth.tesla.com/oauth2/v3/authorize'
const TESLA_REDIRECT_URI = 'https://auth.tesla.com/void/callback'
const TESLA_CLIENT_ID = 'ownerapi'
const TESLA_SCOPE = 'openid email offline_access'

export function buildAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: TESLA_CLIENT_ID,
    redirect_uri: TESLA_REDIRECT_URI,
    response_type: 'code',
    scope: TESLA_SCOPE,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${TESLA_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<AuthTokens> {
  const res = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: TESLA_REDIRECT_URI,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.error || `Token exchange failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    ...data,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const res = await fetch('/api/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    throw new Error('Token refresh failed')
  }

  const data = await res.json()
  return {
    ...data,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

export function extractCodeFromCallbackUrl(
  url: string,
): { code: string; state: string } | null {
  try {
    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')
    if (code && state) return { code, state }
    return null
  } catch {
    return null
  }
}
