import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { validateEmail, validatePassword } from '../utils/validation'
import thoughtfocusLogo from '../assets/thoughtfocus-logo.png'

interface LoginScreenProps {
  onShowSignup?: () => void
}

export function LoginScreen({ onShowSignup }: LoginScreenProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email))
  }

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password))
  }

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

    const result = await login(email, password)
    if (!result.success) {
      setEmailError(result.errors?.email ?? null)
      setPasswordError(result.errors?.password ?? null)
      setSubmitError(result.message ?? 'Please fix the errors below to continue.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">
            <img
              className="login-logo"
              src={thoughtfocusLogo}
              alt="ThoughtFocus"
              width={180}
              height={30}
            />
            <div className="dots">
              <span className="d1" />
              <span className="d2" />
              <span className="d3" />
            </div>
          </div>
          <p className="login-breadcrumb">
            thoughtfocus-ai4dev / <b>login</b>
          </p>
        </div>

        <div className="login-body">
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">
            Sign in with your ThoughtFocus employee email
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
                placeholder="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(null)
                }}
       
                onBlur={handleEmailBlur}
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
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                onBlur={handlePasswordBlur}
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError && (
                <p id="password-error" className="form-error" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary">
              Sign in
            </button>

            {onShowSignup && (
              <p className="auth-switch">
                Don&apos;t have an account?{' '}
                <button type="button" className="auth-switch-link" onClick={onShowSignup}>
                  Sign up
                </button>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
