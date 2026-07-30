import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  validateConfirmPassword,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePassword,
} from '../utils/validation'
import thoughtfocusLogo from '../assets/thoughtfocus-logo.png'
import gradianteLogo from '../assets/gradiante-logo.png'

interface SignupScreenProps {
  onShowLogin: () => void
}

export function SignupScreen({ onShowLogin }: SignupScreenProps) {
  const { signup } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const nextFirstNameError = validateFirstName(firstName)
    const nextLastNameError = validateLastName(lastName)
    const nextEmailError = validateEmail(email)
    const nextPasswordError = validatePassword(password)
    const nextConfirmPasswordError = validateConfirmPassword(password, confirmPassword)

    setFirstNameError(nextFirstNameError)
    setLastNameError(nextLastNameError)
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setConfirmPasswordError(nextConfirmPasswordError)

    if (
      nextFirstNameError ||
      nextLastNameError ||
      nextEmailError ||
      nextPasswordError ||
      nextConfirmPasswordError
    ) {
      setSubmitError('Please fix the errors below to continue.')
      return
    }

    const result = await signup(firstName, lastName, email, password, confirmPassword)
    if (!result.success) {
      setFirstNameError(result.errors?.firstName ?? null)
      setLastNameError(result.errors?.lastName ?? null)
      setEmailError(result.errors?.email ?? null)
      setPasswordError(result.errors?.password ?? null)
      setConfirmPasswordError(result.errors?.confirmPassword ?? null)
      setSubmitError(result.message ?? 'Please fix the errors below to continue.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">
            <div className="login-logos">
              <img
                className="login-logo"
                src={thoughtfocusLogo}
                alt="ThoughtFocus"
                width={180}
                height={30}
              />
              <div className="brand-div" />
              <img
                className="login-logo login-logo-gradiante"
                src={gradianteLogo}
                alt="Gradiante"
                width={36}
                height={36}
              />
            </div>
            <div className="dots">
              <span className="d1" />
              <span className="d2" />
              <span className="d3" />
            </div>
          </div>
          <p className="login-breadcrumb">
            thoughtfocus-ai4dev / <b>signup</b>
          </p>
        </div>

        <div className="login-body">
          <h1 className="login-title">Create account</h1>
          <p className="login-subtitle">
            Register with your ThoughtFocus employee email
          </p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {submitError && (
              <p className="form-error form-error-general" role="alert">
                {submitError}
              </p>
            )}

            <div className="form-field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                className="form-input"
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (firstNameError) setFirstNameError(null)
                }}
                onBlur={() => setFirstNameError(validateFirstName(firstName))}
                aria-invalid={firstNameError ? true : undefined}
                aria-describedby={firstNameError ? 'firstName-error' : undefined}
              />
              {firstNameError && (
                <p id="firstName-error" className="form-error" role="alert">
                  {firstNameError}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                className="form-input"
                type="text"
                name="lastName"
                autoComplete="family-name"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (lastNameError) setLastNameError(null)
                }}
                onBlur={() => setLastNameError(validateLastName(lastName))}
                aria-invalid={lastNameError ? true : undefined}
                aria-describedby={lastNameError ? 'lastName-error' : undefined}
              />
              {lastNameError && (
                <p id="lastName-error" className="form-error" role="alert">
                  {lastNameError}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                className="form-input"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="you@thoughtfocus.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(null)
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? 'signup-email-error' : undefined}
              />
              {emailError && (
                <p id="signup-email-error" className="form-error" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                className="form-input"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                onBlur={() => setPasswordError(validatePassword(password))}
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? 'signup-password-error' : undefined}
              />
              {passwordError && (
                <p id="signup-password-error" className="form-error" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                className="form-input"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError(null)
                }}
                onBlur={() =>
                  setConfirmPasswordError(validateConfirmPassword(password, confirmPassword))
                }
                aria-invalid={confirmPasswordError ? true : undefined}
                aria-describedby={confirmPasswordError ? 'confirmPassword-error' : undefined}
              />
              {confirmPasswordError && (
                <p id="confirmPassword-error" className="form-error" role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary">
              Sign up
            </button>

            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="auth-switch-link" onClick={onShowLogin}>
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
