import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { auth, closeTestContext, createTestContext, login, type TestContext } from './helpers.ts'

describe('login to download data flow', () => {
  let ctx: TestContext

  afterEach(() => {
    if (ctx) closeTestContext(ctx)
  })

  it('creates an artifact, uploads a file, downloads matching bytes, then deletes both', async () => {
    ctx = createTestContext()
    const token = await login(ctx.app)
    const headers = auth(token)
    const contents = '# Runbook\nRestart the lab VM.\n'

    const created = await request(ctx.app).post('/api/v1/artifacts').set(headers).send({
      name: 'Runbook',
      folder: 'ops',
      description: 'Ops runbook',
      status: 'final',
    })
    expect(created.status).toBe(201)
    const artifactId = created.body.data.id as string

    const uploaded = await request(ctx.app)
      .post(`/api/v1/artifacts/${artifactId}/files`)
      .set(headers)
      .attach('file', Buffer.from(contents), 'runbook.md')
    expect(uploaded.status).toBe(201)
    const fileId = uploaded.body.data.id as string

    const listed = await request(ctx.app).get('/api/v1/artifacts').set(headers)
    const runbook = listed.body.data.find((item: { id: string }) => item.id === artifactId)
    expect(runbook.fileCount).toBe(1)

    const downloaded = await request(ctx.app)
      .get(`/api/v1/artifacts/${artifactId}/files/${fileId}/download`)
      .set(headers)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () => callback(null, Buffer.concat(chunks)))
      })
    expect(String(downloaded.body)).toBe(contents)

    const deletedFile = await request(ctx.app)
      .delete(`/api/v1/artifacts/${artifactId}/files/${fileId}`)
      .set(headers)
    expect(deletedFile.status).toBe(204)

    const deletedArtifact = await request(ctx.app).delete(`/api/v1/artifacts/${artifactId}`).set(headers)
    expect(deletedArtifact.status).toBe(204)
  })
})
