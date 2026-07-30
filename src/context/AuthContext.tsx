import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ApiError,
  clearAuthToken,
  getAuthToken,
  loginRequest,
  meRequest,
  setAuthToken,
  signupRequest,
  type AuthUser,
} from '../api/client'
import {
  validateConfirmPassword,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePassword,
} from '../utils/validation'

interface SignupFieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

interface AuthContextValue {
  user: AuthUser | null
  userEmail: string | null
  isLoading: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; errors?: { email?: string; password?: string }; message?: string }>
  signup: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<{ success: boolean; errors?: SignupFieldErrors; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await meRequest()
        setUser(response.user)
      } catch {
        clearAuthToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (emailError || passwordError) {
      return {
        success: false,
        errors: {
          ...(emailError ? { email: emailError } : {}),
          ...(passwordError ? { password: passwordError } : {}),
        },
      }
    }

    try {
      const response = await loginRequest(email, password)
      setAuthToken(response.token)
      setUser(response.user)
      return { success: true }
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        }
      }

      return {
        success: false,
        message: 'Unable to sign in. Please try again.',
      }
    }
  }, [])

  const signup = useCallback(
    async (
      firstName: string,
      lastName: string,
      email: string,
      password: string,
      confirmPassword: string,
    ) => {
      const firstNameError = validateFirstName(firstName)
      const lastNameError = validateLastName(lastName)
      const emailError = validateEmail(email)
      const passwordError = validatePassword(password)
      const confirmPasswordError = validateConfirmPassword(password, confirmPassword)

      if (firstNameError || lastNameError || emailError || passwordError || confirmPasswordError) {
        return {
          success: false,
          errors: {
            ...(firstNameError ? { firstName: firstNameError } : {}),
            ...(lastNameError ? { lastName: lastNameError } : {}),
            ...(emailError ? { email: emailError } : {}),
            ...(passwordError ? { password: passwordError } : {}),
            ...(confirmPasswordError ? { confirmPassword: confirmPasswordError } : {}),
          },
        }
      }

      try {
        const response = await signupRequest(
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
        )
        setAuthToken(response.token)
        setUser(response.user)
        return { success: true }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.details?.length) {
            const fieldErrors: SignupFieldErrors = {}
            for (const detail of error.details) {
              if (detail.field === 'firstName') fieldErrors.firstName = detail.message
              if (detail.field === 'lastName') fieldErrors.lastName = detail.message
              if (detail.field === 'email') fieldErrors.email = detail.message
              if (detail.field === 'password') fieldErrors.password = detail.message
              if (detail.field === 'confirmPassword') fieldErrors.confirmPassword = detail.message
            }
            return { success: false, errors: fieldErrors, message: error.message }
          }

          return { success: false, message: error.message }
        }

        return {
          success: false,
          message: 'Unable to create account. Please try again.',
        }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      userEmail: user?.email ?? null,
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, isLoading, login, signup, logout],
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
