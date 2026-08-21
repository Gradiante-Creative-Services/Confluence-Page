import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { sendData } from '../http.ts'
import { createAuthMiddleware, getActor, requirePermission } from '../middleware/auth.ts'
import { permissionsFor } from '../permissions.ts'
import type { AuthService } from '../services/authService.ts'

export function createAuthRouter(
  auth: AuthService,
  options: { disableRateLimit?: boolean } = {},
): Router {
  const router = Router()
  const requireAuth = createAuthMiddleware(auth)

  if (!options.disableRateLimit) {
    const limiter = rateLimit({
      windowMs: 60_000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          error: {
            code: 'rate_limit_exceeded',
            message: 'Too many attempts. Try again in a minute.',
          },
        })
      },
    })
    router.post('/login', limiter)
    router.post('/signup', limiter)
  }

  router.post('/login', (req, res, next) => {
    try {
      const result = auth.login(req.body ?? {})
      sendData(res, result)
    } catch (error) {
      next(error)
    }
  })

  router.post('/signup', (req, res, next) => {
    try {
      const result = auth.signup(req.body ?? {})
      res.setHeader('Location', `/api/v1/users/${result.user.id}`)
      sendData(res, result, 201)
    } catch (error) {
      next(error)
    }
  })

  router.get('/me', requireAuth, (_req, res, next) => {
    try {
      const user = getActor(res)
      sendData(res, { ...user, permissions: permissionsFor(user.role) })
    } catch (error) {
      next(error)
    }
  })

  router.post('/logout', requireAuth, requirePermission('artifacts:read'), (_req, res) => {
    res.status(204).send()
  })

  return router
}
