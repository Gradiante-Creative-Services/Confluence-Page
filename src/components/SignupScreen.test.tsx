/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../auth/AuthContext'
import { SignupScreen } from './SignupScreen'
import { stubConfluenceApi } from '../test/stubApi'

function renderSignup(onSwitchToLogin = vi.fn()) {
  return render(
    <AuthProvider>
      <SignupScreen onSwitchToLogin={onSwitchToLogin} />
    </AuthProvider>,
  )
}

describe('SignupScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the ThoughtFocus logo and sign-up form', () => {
    renderSignup()

    expect(screen.getByRole('img', { name: 'ThoughtFocus' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows field errors when submitted empty', async () => {
    const user = userEvent.setup()
    renderSignup()

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('rejects non-ThoughtFocus emails', async () => {
    const user = userEvent.setup()
    renderSignup()

    await user.type(screen.getByLabelText(/email/i), 'ada@gmail.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      screen.getByText('Enter a valid @thoughtfocus.com email'),
    ).toBeInTheDocument()
  })

  it('rejects an email that is already registered', async () => {
    stubConfluenceApi()
    const user = userEvent.setup()
    renderSignup()

    await user.type(screen.getByLabelText(/email/i), 'admin@thoughtfocus.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeInTheDocument()
  })

  it('switches back to sign in when the login link is used', async () => {
    const onSwitchToLogin = vi.fn()
    const user = userEvent.setup()
    renderSignup(onSwitchToLogin)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(onSwitchToLogin).toHaveBeenCalledTimes(1)
  })
})
