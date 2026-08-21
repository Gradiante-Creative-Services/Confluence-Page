import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { closeTestContext, createTestContext, type TestContext } from './helpers.ts'

describe('GET /api/v1/health', () => {
  let ctx: TestContext

  afterEach(() => {
    if (ctx) closeTestContext(ctx)
  })

  it('reports ok when sqlite is readable', async () => {
    ctx = createTestContext()
    const response = await request(ctx.app).get('/api/v1/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ data: { status: 'ok', db: 'ok' } })
  })
})
