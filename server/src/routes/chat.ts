import { Router } from 'express'
import { sendData } from '../http.ts'
import { createAuthMiddleware, requirePermission } from '../middleware/auth.ts'
import type { AuthService } from '../services/authService.ts'
import type { ChatService } from '../services/chatService.ts'
import { chatRequestSchema } from '../validation/chat.ts'

export function createChatRouter(auth: AuthService, chat: ChatService): Router {
  const router = Router()
  const requireAuth = createAuthMiddleware(auth)

  router.use(requireAuth)

  router.post('/', requirePermission('chat:ask'), async (req, res, next) => {
    try {
      const body = chatRequestSchema.parse(req.body)
      const result = await chat.ask(body)
      sendData(res, result)
    } catch (error) {
      next(error)
    }
  })

  return router
}
