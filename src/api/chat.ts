import { apiSend } from './client'
import type { ChatResponse, SendChatMessageInput } from './types'

export async function sendChatMessage(input: SendChatMessageInput): Promise<ChatResponse> {
  const result = await apiSend<ChatResponse>('/api/v1/chat', 'POST', input)
  return result.data
}
