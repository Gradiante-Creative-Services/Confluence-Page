/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USERS } from './credentials'
import { login, logout, restoreSession, signup } from './authService'

describe('authService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('posts credentials to /api/v1/auth/login', async () => {
    const admin = DEMO_USERS.find((user) => user.role === 'admin')!
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            role: 'admin',
            displayName: admin.displayName,
          },
          token: 'signed.jwt',
          permissions: ['artifacts:read', 'artifacts:manage', 'uploads:create'],
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await login(admin.email, admin.password)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/auth/login')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({
      email: admin.email,
      password: admin.password,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.session.apiMode).toBe('live')
      expect(result.session.token).toBe('signed.jwt')
      expect(result.session.user.id).toBe(admin.id)
    }
  })

  it('persists the session so restoreSession returns it after login', async () => {
    const member = DEMO_USERS.find((user) => user.role === 'member')!
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            user: {
              id: member.id,
              email: member.email,
              role: member.role,
              displayName: member.displayName,
            },
            token: 'signed.jwt',
          },
        }),
      }),
    )

    await login(member.email, member.password)

    expect(restoreSession()?.user.email).toBe(member.email)
    expect(restoreSession()?.apiMode).toBe('live')
    expect(restoreSession()?.user.id).toBe(member.id)
  })

  it('clears the session on logout', async () => {
    const admin = DEMO_USERS.find((user) => user.role === 'admin')!
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            user: {
              id: admin.id,
              email: admin.email,
              role: admin.role,
              displayName: admin.displayName,
            },
            token: 'signed.jwt',
          },
        }),
      }),
    )
    await login(admin.email, admin.password)
    logout()

    expect(restoreSession()).toBeNull()
  })

  it('surfaces API credential failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: 'invalid_credentials', message: 'Invalid email or password' },
        }),
      }),
    )

    const result = await login('admin@thoughtfocus.com', 'Admin123!')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('INVALID_CREDENTIALS')
      expect(result.message).toBe('Invalid email or password')
    }
  })

  it('surfaces API network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const result = await login('admin@thoughtfocus.com', 'Admin123!')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/API/i)
    }
  })

  it('posts credentials to /api/v1/auth/signup and persists the session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          user: {
            id: '33333333-3333-3333-3333-333333333333',
            email: 'ada@thoughtfocus.com',
            role: 'member',
            displayName: 'Ada',
          },
          token: 'signed.jwt',
          permissions: ['artifacts:read', 'uploads:create'],
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await signup('ada@thoughtfocus.com', 'Password1')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/auth/signup')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({
      email: 'ada@thoughtfocus.com',
      password: 'Password1',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.session.apiMode).toBe('live')
      expect(result.session.token).toBe('signed.jwt')
      expect(result.session.user.email).toBe('ada@thoughtfocus.com')
    }
    expect(restoreSession()?.user.email).toBe('ada@thoughtfocus.com')
  })

  it('surfaces signup email-taken failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: { code: 'conflict', message: 'An account with this email already exists' },
        }),
      }),
    )

    const result = await signup('admin@thoughtfocus.com', 'Password1')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('EMAIL_TAKEN')
      expect(result.message).toBe('An account with this email already exists')
      expect(result.errors?.email).toBe('An account with this email already exists')
    }
  })
})
