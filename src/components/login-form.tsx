import { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { validateEmail, validatePassword } from '@/utils/validation'
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
import thoughtfocusLogo from '@/assets/thoughtfocus-logo.png'

interface LoginFormProps extends React.ComponentProps<'div'> {
  onShowSignup?: () => void
}

export function LoginForm({ className, onShowSignup, ...props }: LoginFormProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    setIsSubmitting(true)
    const result = await login(email, password)
    setIsSubmitting(false)

    if (!result.success) {
      setEmailError(result.errors?.email ?? null)
      setPasswordError(result.errors?.password ?? null)
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
                <img
                  src={thoughtfocusLogo}
                  alt="ThoughtFocus"
                  className="h-7 w-auto"
                />
                <p className="text-xs text-muted-foreground">
                  thoughtfocus-ai4dev / <span className="font-medium text-foreground">login</span>
                </p>
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Sign in with your ThoughtFocus employee email
                </p>
              </div>

              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <Field data-invalid={!!emailError}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
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

              <Field data-invalid={!!passwordError}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  aria-invalid={passwordError ? true : undefined}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(null)
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                />
                {passwordError && (
                  <FieldDescription className="text-destructive">{passwordError}</FieldDescription>
                )}
              </Field>

              <Field>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
                {onShowSignup && (
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{' '}
                    <Button type="button" variant="link" className="h-auto p-0" onClick={onShowSignup}>
                      Sign up
                    </Button>
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src={thoughtfocusLogo}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-contain p-12 opacity-30"
            />
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
