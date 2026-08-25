import { afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { SEED_BRD_ID } from '../seeds/seed.ts'
import type { GeminiClient } from '../src/services/geminiClient.ts'
import {
  auth,
  closeTestContext,
  createFakeGeminiClient,
  createTestContext,
  login,
  type TestContext,
} from './helpers.ts'

const DOC_BODY = `# Quantum photon lab notes

Photon entanglement is used in the staging cluster lab.
Blue-green releases keep the quantum experiment online during deploys.
`

async function waitForIngestDone(
  app: TestContext['app'],
  token: string,
  fileId: string,
  timeoutMs = 5000,
): Promise<{ status: string; chunkCount: number }> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const status = await request(app)
      .get(`/api/v1/rag/ingest/${fileId}/status`)
      .set(auth(token))

    if (status.status === 200 && status.body.data.status === 'done') {
      return status.body.data
    }
    if (status.status === 200 && status.body.data.status === 'failed') {
      throw new Error(`Ingest failed: ${status.body.data.errorMessage ?? 'unknown'}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error(`Timed out waiting for ingest of ${fileId}`)
}

/** Orthogonal vectors for guardrail vs matching queries — never calls live Gemini. */
function createRagTestGemini(): GeminiClient {
  const base = createFakeGeminiClient()
  const matchVector = [0, 1, 0, 0, 0, 0, 0, 0]
  const missVector = [1, 0, 0, 0, 0, 0, 0, 0]

  return {
    async embedTexts(texts: string[]): Promise<number[][]> {
      return texts.map((text) => {
        const lower = text.toLowerCase()
        if (lower.includes('totally_unrelated_xyzzy')) return missVector
        if (
          lower.includes('quantum') ||
          lower.includes('photon') ||
          lower.includes('blue-green') ||
          lower.includes('entanglement')
        ) {
          return matchVector
        }
        return missVector
      })
    },
    generateChat: base.generateChat,
  }
}

describe('RAG ingest + chat', () => {
  let ctx: TestContext

  afterEach(() => {
    if (ctx) closeTestContext(ctx)
  })

  it('indexes an uploaded .md and returns a grounded chat answer with sources', async () => {
    ctx = createTestContext(createRagTestGemini())
    const token = await login(ctx.app)

    const uploaded = await request(ctx.app)
      .post(`/api/v1/artifacts/${SEED_BRD_ID}/files`)
      .set(auth(token))
      .attach('file', Buffer.from(DOC_BODY), 'quantum-lab.md')

    expect(uploaded.status).toBe(201)
    const fileId = uploaded.body.data.id as string

    const job = await waitForIngestDone(ctx.app, token, fileId)
    expect(job.chunkCount).toBeGreaterThan(0)

    const chat = await request(ctx.app)
      .post('/api/v1/chat')
      .set(auth(token))
      .send({
        message: 'How do photon entanglement and blue-green releases work?',
        artifactIds: [SEED_BRD_ID],
      })

    expect(chat.status).toBe(200)
    expect(chat.body.data.answer).toMatch(/Based on the documents/)
    expect(chat.body.data.sources.length).toBeGreaterThan(0)
    expect(chat.body.data.sources[0]).toMatchObject({
      fileId,
      artifactId: SEED_BRD_ID,
      filename: 'quantum-lab.md',
      content: expect.stringContaining('Photon'),
      score: expect.any(Number),
      chunkIndex: expect.any(Number),
    })
    expect(chat.body.data.sources[0].score).toBeGreaterThanOrEqual(0.55)
  })

  it('returns the guardrail answer when similarity is below threshold', async () => {
    ctx = createTestContext(createRagTestGemini())
    const token = await login(ctx.app)

    const uploaded = await request(ctx.app)
      .post(`/api/v1/artifacts/${SEED_BRD_ID}/files`)
      .set(auth(token))
      .attach('file', Buffer.from(DOC_BODY), 'quantum-lab.md')

    expect(uploaded.status).toBe(201)
    await waitForIngestDone(ctx.app, token, uploaded.body.data.id as string)

    const chat = await request(ctx.app)
      .post('/api/v1/chat')
      .set(auth(token))
      .send({
        message: 'Tell me about totally_unrelated_xyzzy cuisine recipes',
        artifactIds: [SEED_BRD_ID],
      })

    expect(chat.status).toBe(200)
    expect(chat.body.data.answer).toBe('Not in uploaded documents')
    expect(chat.body.data.sources).toEqual([])
  })
})
