import type { ChunkRepository, DocumentChunkRecord } from '../repositories/chunkRepository.ts'
import type { GeminiClient } from './geminiClient.ts'

export const SIMILARITY_THRESHOLD = 0.55
export const TOP_K = 5
export const GUARDRAIL_ANSWER = 'Not in uploaded documents'

export interface ChatSource {
  fileId: string
  artifactId: string
  filename: string
  chunkIndex: number
  content: string
  score: number
}

export interface ChatResult {
  answer: string
  sources: ChatSource[]
  conversationId?: string
}

export interface ChatRequest {
  message: string
  artifactIds?: string[]
  conversationId?: string
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    dot += av * bv
    normA += av * av
    normB += bv * bv
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function toSource(chunk: DocumentChunkRecord, score: number): ChatSource {
  return {
    fileId: chunk.fileId,
    artifactId: chunk.artifactId,
    filename: chunk.filename,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    score,
  }
}

const SYSTEM_PROMPT = `You are a documentation assistant for the ThoughtFocus Confluence Page hub.
Answer ONLY using the provided source chunks.
Cite sources using [filename] inline when you use them.
If the chunks do not contain enough information, reply exactly: Not in uploaded documents
Do not invent facts outside the sources.`

function buildUserPrompt(message: string, sources: ChatSource[]): string {
  const context = sources
    .map(
      (source, index) =>
        `[${index + 1}] file=${source.filename} score=${source.score.toFixed(3)}\n${source.content}`,
    )
    .join('\n\n')

  return `Sources:\n${context}\n\nQuestion: ${message}`
}

export function createChatService(chunks: ChunkRepository, gemini: GeminiClient) {
  return {
    async ask(input: ChatRequest): Promise<ChatResult> {
      const conversationId = input.conversationId

      const [queryEmbedding] = await gemini.embedTexts([input.message])
      if (!queryEmbedding) {
        return {
          answer: GUARDRAIL_ANSWER,
          sources: [],
          ...(conversationId ? { conversationId } : {}),
        }
      }

      const candidates =
        input.artifactIds && input.artifactIds.length > 0
          ? chunks.listByArtifactIds(input.artifactIds)
          : chunks.listAll()

      const ranked = candidates
        .map((chunk) => ({
          chunk,
          score: cosineSimilarity(queryEmbedding, chunk.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_K)

      const best = ranked[0]
      if (!best || best.score < SIMILARITY_THRESHOLD) {
        return {
          answer: GUARDRAIL_ANSWER,
          sources: [],
          ...(conversationId ? { conversationId } : {}),
        }
      }

      const sources = ranked.map((item) => toSource(item.chunk, item.score))
      const answer = await gemini.generateChat(SYSTEM_PROMPT, buildUserPrompt(input.message, sources))

      return {
        answer,
        sources,
        ...(conversationId ? { conversationId } : {}),
      }
    },
  }
}

export type ChatService = ReturnType<typeof createChatService>
