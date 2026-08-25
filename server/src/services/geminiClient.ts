import { GoogleGenerativeAI } from '@google/generative-ai'
import { serviceUnavailable } from '../errors.ts'

/** text-embedding-004 was shut down Jan 2026; gemini-embedding-001 is the stable text model. */
const EMBEDDING_MODEL = 'gemini-embedding-001'
/** Prefer lite-latest — flash-latest / 2.0-flash 404 or 503 on this API key. */
const CHAT_MODEL = 'gemini-flash-lite-latest'
const EMBED_BATCH_SIZE = 100

export interface GeminiClient {
  embedTexts(texts: string[]): Promise<number[][]>
  generateChat(systemPrompt: string, userMessage: string): Promise<string>
}

export function createGeminiClient(apiKey: string | undefined): GeminiClient {
  if (!apiKey) {
    return {
      async embedTexts(): Promise<number[][]> {
        throw serviceUnavailable('GEMINI_API_KEY is not configured')
      },
      async generateChat(): Promise<string> {
        throw serviceUnavailable('GEMINI_API_KEY is not configured')
      },
    }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
  const chatModel = genAI.getGenerativeModel({ model: CHAT_MODEL })

  return {
    async embedTexts(texts: string[]): Promise<number[][]> {
      if (texts.length === 0) return []

      const vectors: number[][] = []
      for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
        const batch = texts.slice(i, i + EMBED_BATCH_SIZE)
        const result = await embeddingModel.batchEmbedContents({
          requests: batch.map((text) => ({
            content: { role: 'user', parts: [{ text }] },
          })),
        })
        for (const embedding of result.embeddings) {
          vectors.push(embedding.values)
        }
      }
      return vectors
    },

    async generateChat(systemPrompt: string, userMessage: string): Promise<string> {
      const result = await chatModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: systemPrompt,
      })
      const text = result.response.text()
      return text.trim()
    },
  }
}
