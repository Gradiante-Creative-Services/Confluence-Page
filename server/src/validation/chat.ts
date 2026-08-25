import { z } from 'zod'

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(4000),
  artifactIds: z.array(z.string().trim().min(1)).max(50).optional(),
  conversationId: z.string().trim().min(1).max(120).optional(),
})
