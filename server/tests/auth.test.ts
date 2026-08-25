import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { auth, closeTestContext, createTestContext, login, type TestContext } from './helpers.ts'

describe('auth API', () => {
  let ctx: TestContext

  afterEach(() => {
    if (ctx) closeTestContext(ctx)
  })

  it('logs in the seeded admin and returns a signed token', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/login').send({
      email: 'admin@thoughtfocus.com',
      password: 'Admin123!',
    })

    expect(response.status).toBe(200)
    expect(response.body.data.user).toMatchObject({
      email: 'admin@thoughtfocus.com',
      role: 'admin',
      displayName: 'Program Admin',
    })
    expect(response.body.data.user.id).toEqual(expect.any(String))
    expect(response.body.data.token).toEqual(expect.any(String))
    expect(response.body.data.permissions).toEqual(
      expect.arrayContaining(['artifacts:read', 'artifacts:manage', 'uploads:create']),
    )
  })

  it('returns 400 with field details for invalid email', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/login').send({
      email: 'ada@gmail.com',
      password: 'Password1',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('validation_error')
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: expect.stringMatching(/thoughtfocus.com/) }),
      ]),
    )
  })

  it('returns 401 for unknown credentials without revealing which field failed', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/login').send({
      email: 'unknown@thoughtfocus.com',
      password: 'Password1',
    })

    expect(response.status).toBe(401)
    expect(response.body.error).toEqual({
      code: 'invalid_credentials',
      message: 'Invalid email or password',
    })
  })

  it('returns the current user from a bearer token', async () => {
    ctx = createTestContext()
    const token = await login(ctx.app)
    const response = await request(ctx.app).get('/api/v1/auth/me').set(auth(token))
    expect(response.status).toBe(200)
    expect(response.body.data.email).toBe('admin@thoughtfocus.com')
  })

  it('rejects missing tokens', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).get('/api/v1/auth/me')
    expect(response.status).toBe(401)
  })

  it('logout returns 204 for an authenticated user', async () => {
    ctx = createTestContext()
    const token = await login(ctx.app)
    const response = await request(ctx.app).post('/api/v1/auth/logout').set(auth(token))
    expect(response.status).toBe(204)
  })

  it('creates a member account and returns a signed token', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/signup').send({
      email: 'ada@thoughtfocus.com',
      password: 'Password1',
    })

    expect(response.status).toBe(201)
    expect(response.headers.location).toBe(`/api/v1/users/${response.body.data.user.id}`)
    expect(response.body.data.user).toMatchObject({
      email: 'ada@thoughtfocus.com',
      role: 'member',
      displayName: 'Ada',
    })
    expect(response.body.data.user.id).toEqual(expect.any(String))
    expect(response.body.data.token).toEqual(expect.any(String))
    expect(response.body.data.permissions).toEqual([
      'artifacts:read',
      'uploads:create',
      'chat:ask',
    ])
    expect(JSON.stringify(response.body)).not.toMatch(/password/i)
  })

  it('returns 400 with field details for invalid signup email', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/signup').send({
      email: 'ada@gmail.com',
      password: 'Password1',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('validation_error')
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: expect.stringMatching(/thoughtfocus.com/) }),
      ]),
    )
  })

  it('returns 400 with field details for a weak signup password', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/signup').send({
      email: 'ada@thoughtfocus.com',
      password: 'short',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('validation_error')
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'password',
          message: expect.stringMatching(/8 characters/),
        }),
      ]),
    )
  })

  it('returns 409 when the email is already registered', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/signup').send({
      email: 'admin@thoughtfocus.com',
      password: 'Password1',
    })

    expect(response.status).toBe(409)
    expect(response.body.error).toEqual({
      code: 'conflict',
      message: 'An account with this email already exists',
    })
  })

  it('lets a newly signed-up member sign in', async () => {
    ctx = createTestContext()
    await request(ctx.app).post('/api/v1/auth/signup').send({
      email: 'new.member@thoughtfocus.com',
      password: 'Password1',
    })

    const response = await request(ctx.app).post('/api/v1/auth/login').send({
      email: 'new.member@thoughtfocus.com',
      password: 'Password1',
    })

    expect(response.status).toBe(200)
    expect(response.body.data.user.email).toBe('new.member@thoughtfocus.com')
    expect(response.body.data.user.role).toBe('member')
    expect(response.body.data.user.displayName).toBe('New Member')
  })

  it('ignores a client-supplied role and always creates a member', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/auth/signup').send({
      email: 'eve@thoughtfocus.com',
      password: 'Password1',
      role: 'admin',
    })

    expect(response.status).toBe(201)
    expect(response.body.data.user.role).toBe('member')
    expect(response.body.data.permissions).not.toContain('artifacts:manage')
  })
})
