/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../auth/AuthContext'
import { LoginScreen } from './LoginScreen'
import { stubConfluenceApi } from '../test/stubApi'

function renderLogin(onSwitchToSignup = vi.fn()) {
  return render(
    <AuthProvider>
      <LoginScreen onSwitchToSignup={onSwitchToSignup} />
    </AuthProvider>,
  )
}

describe('LoginScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the ThoughtFocus logo and sign-in form', () => {
    renderLogin()

    expect(screen.getByRole('img', { name: 'ThoughtFocus' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('does not show demo account credentials', () => {
    renderLogin()

    expect(screen.queryByText(/demo accounts/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/admin@thoughtfocus.com/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/member@thoughtfocus.com/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Admin123!')).not.toBeInTheDocument()
    expect(screen.queryByText('Member123!')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /mock/i })).not.toBeInTheDocument()
  })

  it('shows field errors when submitted empty', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('rejects non-ThoughtFocus emails', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'ada@gmail.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      screen.getByText('Enter a valid @thoughtfocus.com email'),
    ).toBeInTheDocument()
  })

  it('rejects unknown credentials from the API', async () => {
    stubConfluenceApi()
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'unknown@thoughtfocus.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })

  it('switches to sign up when the create-account link is used', async () => {
    const onSwitchToSignup = vi.fn()
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <LoginScreen onSwitchToSignup={onSwitchToSignup} />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: /create one/i }))

    expect(onSwitchToSignup).toHaveBeenCalledTimes(1)
  })
})
