import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  login as authenticate,
  logout as clearAuth,
  restoreSession,
  signup as register,
  type LoginOutcome,
  type SignupOutcome,
} from './authService'
import type { AuthSession } from './types'

interface AuthContextValue {
  session: AuthSession | null
  login: (email: string, password: string) => Promise<LoginOutcome>
  signup: (email: string, password: string) => Promise<SignupOutcome>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => restoreSession())

  const login = useCallback(async (email: string, password: string) => {
    const result = await authenticate(email, password)
    if (result.ok) {
      setSession(result.session)
    }
    return result
  }, [])

  const signup = useCallback(async (email: string, password: string) => {
    const result = await register(email, password)
    if (result.ok) {
      setSession(result.session)
    }
    return result
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, login, signup, logout }),
    [session, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
