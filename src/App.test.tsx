/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './auth/AuthContext'
import App from './App'
import { stubConfluenceApi } from './test/stubApi'

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  )
}

async function signIn(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/email/i), email)
  await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole('button', { name: /sign in/i }))
  return user
}

describe('App auth gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows login until a user signs in', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Confluence Page/i })).not.toBeInTheDocument()
  })

  it('lets an admin sign in and see manage tools plus seeded artifacts', async () => {
    const fetchMock = stubConfluenceApi()
    renderApp()

    await signIn('admin@thoughtfocus.com', 'Admin123!')

    expect(await screen.findByRole('heading', { name: /Confluence Page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new artifact/i })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: 'ThoughtFocus' }).length).toBeGreaterThan(0)
    expect(screen.getByText(/admin@thoughtfocus.com/i)).toBeInTheDocument()
    expect(screen.getByText(/role:\s*admin/i)).toBeInTheDocument()
    expect(screen.getByText(/api:\s*live/i)).toBeInTheDocument()
    expect(await screen.findByText('BRD')).toBeInTheDocument()
    expect(screen.getByText('Architecture')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith('/api/v1/artifacts'))).toBe(
      true,
    )
  })

  it('lets a member sign in without artifact manage tools', async () => {
    stubConfluenceApi()
    renderApp()

    await signIn('member@thoughtfocus.com', 'Member123!')

    expect(await screen.findByRole('heading', { name: /Confluence Page/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new artifact/i })).not.toBeInTheDocument()
    expect(screen.getByText(/role:\s*member/i)).toBeInTheDocument()
  })

  it('signs out back to the login screen', async () => {
    stubConfluenceApi()
    renderApp()

    const user = await signIn('member@thoughtfocus.com', 'Member123!')
    await screen.findByRole('heading', { name: /Confluence Page/i })
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('places Sign out in the title bar, not the status bar', async () => {
    stubConfluenceApi()
    renderApp()

    await signIn('member@thoughtfocus.com', 'Member123!')
    await screen.findByRole('heading', { name: /Confluence Page/i })

    const signOut = screen.getByRole('button', { name: /sign out/i })
    expect(signOut.closest('.titlebar')).not.toBeNull()
    expect(signOut.closest('.statusbar')).toBeNull()
  })

  it('lets a visitor open sign up from the login screen', async () => {
    renderApp()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /create one/i }))

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('lets a new member create an account and enter the hub', async () => {
    const fetchMock = stubConfluenceApi()
    renderApp()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /create one/i }))
    await user.type(screen.getByLabelText(/email/i), 'ada@thoughtfocus.com')
    await user.type(screen.getByLabelText(/password/i), 'Password1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('heading', { name: /Confluence Page/i })).toBeInTheDocument()
    expect(screen.getByText(/ada@thoughtfocus.com/i)).toBeInTheDocument()
    expect(screen.getByText(/role:\s*member/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/signup',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
