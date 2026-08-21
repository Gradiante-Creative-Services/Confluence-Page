import { describe, expect, it } from 'vitest'
import { authenticateCredentials, DEMO_USERS } from './credentials'

describe('authenticateCredentials', () => {
  it('returns validation errors for invalid email or password shape', () => {
    const result = authenticateCredentials('ada@gmail.com', 'short')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('VALIDATION')
      if (result.code === 'VALIDATION') {
        expect(result.errors.email).toMatch(/thoughtfocus.com/)
        expect(result.errors.password).toMatch(/8 characters/)
      }
    }
  })

  it('rejects unknown ThoughtFocus accounts without revealing which field failed', () => {
    const result = authenticateCredentials(
      'unknown@thoughtfocus.com',
      'Password1',
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('INVALID_CREDENTIALS')
      expect(result.message).toBe('Invalid email or password')
    }
  })

  it('authenticates the demo admin with the admin role', () => {
    const admin = DEMO_USERS.find((user) => user.role === 'admin')
    expect(admin).toBeDefined()

    const result = authenticateCredentials(admin!.email, admin!.password)

    expect(result).toEqual({
      ok: true,
      user: {
        id: admin!.id,
        email: admin!.email,
        role: 'admin',
        displayName: admin!.displayName,
      },
    })
  })

  it('authenticates the demo member with the member role', () => {
    const member = DEMO_USERS.find((user) => user.role === 'member')
    expect(member).toBeDefined()

    const result = authenticateCredentials(
      member!.email.toUpperCase(),
      member!.password,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user.role).toBe('member')
      expect(result.user.email).toBe(member!.email)
    }
  })
})
