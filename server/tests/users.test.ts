import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { auth, closeTestContext, createTestContext, login, type TestContext } from './helpers.ts'

describe('users API', () => {
  let ctx: TestContext

  afterEach(() => {
    if (ctx) closeTestContext(ctx)
  })

  it('lists users for an admin and omits password hashes', async () => {
    ctx = createTestContext()
    const token = await login(ctx.app)
    const response = await request(ctx.app).get('/api/v1/users').set(auth(token))

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(2)
    expect(response.body.data[0]).not.toHaveProperty('passwordHash')
    expect(JSON.stringify(response.body)).not.toMatch(/password/i)
  })

  it('forbids members from listing users', async () => {
    ctx = createTestContext()
    const token = await login(ctx.app, 'member@thoughtfocus.com', 'Member123!')
    const response = await request(ctx.app).get('/api/v1/users').set(auth(token))
    expect(response.status).toBe(403)
  })

  it('returns 404 for an unknown user id', async () => {
    ctx = createTestContext()
    const token = await login(ctx.app)
    const response = await request(ctx.app)
      .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
      .set(auth(token))
    expect(response.status).toBe(404)
  })
})
