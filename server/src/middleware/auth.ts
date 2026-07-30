import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../errors/AppError.js'
import type { JwtPayload, UserRole } from '../types/models.js'

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'))
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    }
    next()
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'))
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    next(new AppError(403, 'FORBIDDEN', 'Admin access required'))
    return
  }
  next()
}

export function signToken(payload: { sub: number; email: string; role: UserRole }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}
