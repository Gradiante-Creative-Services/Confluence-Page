import type { AuthSession } from './types'

export const SESSION_STORAGE_KEY = 'tf-auth-session'

export function saveSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function loadSession(): AuthSession | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.user?.id || !parsed?.user?.email || !parsed.token || !parsed.apiMode) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
}
