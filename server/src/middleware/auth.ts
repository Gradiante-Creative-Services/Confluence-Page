import type { NextFunction, Request, Response } from 'express'
import { forbidden, unauthorized } from '../errors.ts'
import { can, type Permission } from '../permissions.ts'
import type { AuthService } from '../services/authService.ts'
import type { PublicUser } from '../types.ts'

export function getActor(res: Response): PublicUser {
  const user = res.locals.user as PublicUser | undefined
  if (!user) throw unauthorized()
  return user
}

export function createAuthMiddleware(auth: AuthService) {
  return function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      next(unauthorized())
      return
    }

    try {
      res.locals.user = auth.verify(header.slice('Bearer '.length))
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function requirePermission(permission: Permission) {
  return function permissionGuard(_req: Request, res: Response, next: NextFunction): void {
    try {
      const user = getActor(res)
      if (!can(user.role, permission)) {
        throw forbidden()
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}
