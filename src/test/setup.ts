import { afterEach } from 'vitest'

afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react')
    cleanup()
  }

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})
