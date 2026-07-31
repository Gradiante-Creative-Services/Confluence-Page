import { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  validateConfirmPassword,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePassword,
} from '@/utils/validation'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import gradianteLogo from '@/assets/gradiante-logo.png'
import thoughtfocusLogo from '@/assets/thoughtfocus-logo.png'

interface SignupFormProps extends React.ComponentProps<'div'> {
  onShowLogin: () => void
}

export function SignupForm({ className, onShowLogin, ...props }: SignupFormProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    setIsSubmitting(true)
    const result = await signup(firstName, lastName, email, password, confirmPassword)
    setIsSubmitting(false)

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
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-3">
                  <img src={thoughtfocusLogo} alt="ThoughtFocus" className="h-7 w-auto" />
                  <img src={gradianteLogo} alt="Gradiante" className="size-8 rounded-md" />
                </div>
                <p className="text-xs text-muted-foreground">
                  thoughtfocus-ai4dev / <span className="font-medium text-foreground">signup</span>
                </p>
                <h1 className="text-2xl font-bold">Create account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Register with your ThoughtFocus employee email
                </p>
              </div>

              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!firstNameError}>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    placeholder="Jane"
                    value={firstName}
                    aria-invalid={firstNameError ? true : undefined}
                    onChange={(e) => {
                      setFirstName(e.target.value)
                      if (firstNameError) setFirstNameError(null)
                    }}
                    onBlur={() => setFirstNameError(validateFirstName(firstName))}
                  />
                  {firstNameError && (
                    <FieldDescription className="text-destructive">{firstNameError}</FieldDescription>
                  )}
                </Field>

                <Field data-invalid={!!lastNameError}>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    placeholder="Doe"
                    value={lastName}
                    aria-invalid={lastNameError ? true : undefined}
                    onChange={(e) => {
                      setLastName(e.target.value)
                      if (lastNameError) setLastNameError(null)
                    }}
                    onBlur={() => setLastNameError(validateLastName(lastName))}
                  />
                  {lastNameError && (
                    <FieldDescription className="text-destructive">{lastNameError}</FieldDescription>
                  )}
                </Field>
              </div>

              <Field data-invalid={!!emailError}>
                <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@thoughtfocus.com"
                  value={email}
                  aria-invalid={emailError ? true : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(null)
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                />
                {emailError && (
                  <FieldDescription className="text-destructive">{emailError}</FieldDescription>
                )}
              </Field>

              <Field data-invalid={!!passwordError || !!confirmPasswordError}>
                <div className="grid grid-cols-2 gap-4">
                  <Field data-invalid={!!passwordError}>
                    <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create a password"
                      value={password}
                      aria-invalid={passwordError ? true : undefined}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (passwordError) setPasswordError(null)
                      }}
                      onBlur={() => setPasswordError(validatePassword(password))}
                    />
                  </Field>
                  <Field data-invalid={!!confirmPasswordError}>
                    <FieldLabel htmlFor="confirmPassword">Confirm</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      aria-invalid={confirmPasswordError ? true : undefined}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (confirmPasswordError) setConfirmPasswordError(null)
                      }}
                      onBlur={() =>
                        setConfirmPasswordError(validateConfirmPassword(password, confirmPassword))
                      }
                    />
                  </Field>
                </div>
                {(passwordError || confirmPasswordError) && (
                  <FieldDescription className="text-destructive">
                    {passwordError ?? confirmPasswordError}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Creating account…' : 'Sign up'}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{' '}
                  <Button type="button" variant="link" className="h-auto p-0" onClick={onShowLogin}>
                    Sign in
                  </Button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src={gradianteLogo}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 m-auto size-32 object-contain opacity-40"
            />
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
