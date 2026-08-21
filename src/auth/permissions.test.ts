import { describe, expect, it } from 'vitest'
import { can } from './permissions'

describe('role permissions', () => {
  it('lets both roles read artifacts', () => {
    expect(can('admin', 'artifacts:read')).toBe(true)
    expect(can('member', 'artifacts:read')).toBe(true)
  })

  it('lets both roles create uploads', () => {
    expect(can('admin', 'uploads:create')).toBe(true)
    expect(can('member', 'uploads:create')).toBe(true)
  })

  it('lets only admins manage artifacts', () => {
    expect(can('admin', 'artifacts:manage')).toBe(true)
    expect(can('member', 'artifacts:manage')).toBe(false)
  })
})
