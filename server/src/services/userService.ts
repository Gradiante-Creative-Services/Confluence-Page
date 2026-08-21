import { notFound } from '../errors.ts'
import { parsePage } from '../http.ts'
import { permissionsFor } from '../permissions.ts'
import type { UserRepository } from '../repositories/userRepository.ts'
import { toPublicUser } from './authService.ts'

export function createUserService(users: UserRepository) {
  return {
    list(query: { page?: unknown; per_page?: unknown }) {
      const { page, perPage, offset } = parsePage(query as { page?: string; per_page?: string })
      const total = users.count()
      const data = users.list(perPage, offset).map((user) => ({
        ...toPublicUser(user),
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      }))
      return { data, total, page, perPage }
    },
    getById(id: string) {
      const user = users.findById(id)
      if (!user) throw notFound('User', id)
      return {
        ...toPublicUser(user),
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        permissions: permissionsFor(user.role),
      }
    },
  }
}

export type UserService = ReturnType<typeof createUserService>
