import type { PKCEPair } from '../types/tesla'

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generatePKCEPair(): Promise<PKCEPair> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const code_verifier = base64UrlEncode(randomBytes.buffer)

  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(code_verifier))
  const code_challenge = base64UrlEncode(digest)

  return { code_verifier, code_challenge }
}
