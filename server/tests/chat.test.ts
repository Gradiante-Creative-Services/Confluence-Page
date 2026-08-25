import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { auth, closeTestContext, createTestContext, login, type TestContext } from './helpers.ts'

describe('chat API', () => {
  let ctx: TestContext

  afterEach(() => {
    if (ctx) closeTestContext(ctx)
  })

  it('requires authentication', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).post('/api/v1/chat').send({
      message: 'What is in the docs?',
    })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('unauthorized')
  })

  it('rejects an empty message with 422', async () => {
    ctx = createTestContext()
    const token = await login(ctx.app)

    const response = await request(ctx.app)
      .post('/api/v1/chat')
      .set(auth(token))
      .send({ message: '   ' })

    expect(response.status).toBe(422)
    expect(response.body.error.code).toBe('validation_error')
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'message' }),
      ]),
    )
  })
})
