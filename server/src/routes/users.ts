import { Router } from 'express'
import { buildLinks, routeParam, sendData } from '../http.ts'
import { createAuthMiddleware, requirePermission } from '../middleware/auth.ts'
import type { AuthService } from '../services/authService.ts'
import type { UserService } from '../services/userService.ts'

export function createUserRouter(auth: AuthService, users: UserService): Router {
  const router = Router()
  const requireAuth = createAuthMiddleware(auth)

  router.use(requireAuth, requirePermission('artifacts:manage'))

  router.get('/', (req, res, next) => {
    try {
      const result = users.list(req.query)
      sendData(res, result.data, 200, {
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
          totalPages: Math.max(1, Math.ceil(result.total / result.perPage) || 1),
        },
        links: buildLinks('/api/v1/users', result.page, result.perPage, result.total, {}),
      })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id', (req, res, next) => {
    try {
      sendData(res, users.getById(routeParam(req.params.id)))
    } catch (error) {
      next(error)
    }
  })

  return router
}
