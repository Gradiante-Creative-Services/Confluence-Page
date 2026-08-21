import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { validateEmail, validatePassword } from '../auth/validation'
import { BrandMark } from './BrandMark'

interface LoginScreenProps {
  onSwitchToSignup: () => void
}

export function LoginScreen({ onSwitchToSignup }: LoginScreenProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const nextEmailError = validateEmail(email)
    const nextPasswordError = validatePassword(password)
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)

    if (nextEmailError || nextPasswordError) {
      setSubmitError('Please fix the errors below to continue.')
      return
    }

    setPending(true)
    try {
      const result = await login(email, password)
      if (!result.ok) {
        setEmailError(result.errors?.email ?? null)
        setPasswordError(result.errors?.password ?? null)
        setSubmitError(result.message)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <BrandMark size="md" />
          <p className="login-breadcrumb">
            Confluence Page / <b>login</b>
          </p>
        </div>

        <div className="login-body">
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">
            Use your ThoughtFocus employee email to open Confluence Page.
          </p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {submitError && (
              <p className="form-error form-error-general" role="alert">
                {submitError}
              </p>
            )}

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="you@thoughtfocus.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (emailError) setEmailError(null)
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className="form-error" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                onBlur={() => setPasswordError(validatePassword(password))}
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError && (
                <p id="password-error" className="form-error" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="login-switch">
            Don&apos;t have an account?{' '}
            <button type="button" className="login-switch-link" onClick={onSwitchToSignup}>
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
