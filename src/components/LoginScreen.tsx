import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { validateEmail, validatePassword } from '../auth/validation'
import { BrandMark } from './BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
          <div className="login-window-dots" aria-hidden="true">
            <span className="login-window-dot login-window-dot-close" />
            <span className="login-window-dot login-window-dot-min" />
            <span className="login-window-dot login-window-dot-max" />
          </div>
          <BrandMark size="md" />
          <p className="login-breadcrumb">
            thoughtfocus-ai4dev / <b>login</b>
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
              <Label htmlFor="email">Email</Label>
              <Input
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
              <Label htmlFor="password">Password</Label>
              <Input
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

            <Button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in'}
              {!pending && <LogIn data-icon="inline-end" />}
            </Button>
          </form>

          <p className="login-switch">
            Don&apos;t have an account?{' '}
            <Button
              type="button"
              variant="link"
              className="login-switch-link h-auto px-0"
              onClick={onSwitchToSignup}
            >
              Create account
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
