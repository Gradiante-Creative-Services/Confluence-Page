export type Role = 'admin' | 'member'
export type Permission = 'artifacts:read' | 'artifacts:manage' | 'uploads:create'

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ['artifacts:read', 'artifacts:manage', 'uploads:create'],
  member: ['artifacts:read', 'uploads:create'],
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function permissionsFor(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]]
}
