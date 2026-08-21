/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet } from './client'
import { saveSession } from '../auth/session'

describe('api client', () => {
  it('attaches the bearer token and unwraps data', async () => {
    saveSession({
      user: {
        id: '1',
        email: 'admin@thoughtfocus.com',
        role: 'admin',
        displayName: 'Admin',
      },
      token: 'abc',
      apiMode: 'live',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'art-1' } }),
      }),
    )

    const data = await apiGet<{ id: string }>('/api/v1/artifacts/art-1')
    expect(data).toEqual({ id: 'art-1' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/artifacts/art-1',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    const headers = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock
      .calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer abc')
    vi.unstubAllGlobals()
  })

  it('throws ApiError for envelope failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: { code: 'forbidden', message: 'Insufficient permissions' },
        }),
      }),
    )

    await expect(apiGet('/api/v1/users')).rejects.toMatchObject({
      status: 403,
      code: 'forbidden',
    } satisfies Partial<ApiError>)
    vi.unstubAllGlobals()
  })
})
