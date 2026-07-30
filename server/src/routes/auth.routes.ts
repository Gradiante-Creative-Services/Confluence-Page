import { Router } from 'express'
import { env } from '../config/env.js'
import { signToken, authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { loginSchema, signupSchema } from '../schemas/auth.schema.js'
import * as authService from '../services/auth.service.js'

export const authRouter = Router()

authRouter.post('/login', validate({ body: loginSchema }), (req, res) => {
  const user = authService.login(req.body.email, req.body.password)
  const token = signToken({ sub: user.id, email: user.email, role: user.role })

  res.json({
    token,
    expiresIn: env.jwtExpiresIn,
    user,
  })
})

authRouter.post('/signup', validate({ body: signupSchema }), (req, res) => {
  const user = authService.signup(
    req.body.firstName,
    req.body.lastName,
    req.body.email,
    req.body.password,
  )
  const token = signToken({ sub: user.id, email: user.email, role: user.role })

  res.status(201).json({
    token,
    expiresIn: env.jwtExpiresIn,
    user,
  })
})

authRouter.get('/me', authenticate, (req, res) => {
  const user = authService.getUserById(req.user!.id)
  res.json({ user })
})
