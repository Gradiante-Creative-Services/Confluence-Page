import { describe, expect, it } from 'vitest'
import { validateEmail, validatePassword } from './validation'

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('')).toBe('Email is required')
    expect(validateEmail('   ')).toBe('Email is required')
  })

  it('rejects emails that are not @thoughtfocus.com', () => {
    expect(validateEmail('ada@gmail.com')).toBe(
      'Enter a valid @thoughtfocus.com email',
    )
    expect(validateEmail('not-an-email')).toBe(
      'Enter a valid @thoughtfocus.com email',
    )
  })

  it('accepts ThoughtFocus employee emails regardless of case', () => {
    expect(validateEmail('ada@thoughtfocus.com')).toBeNull()
    expect(validateEmail('  Ada@ThoughtFocus.com  ')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('requires a value', () => {
    expect(validatePassword('')).toBe('Password is required')
  })

  it('requires at least 8 characters with a letter and a number', () => {
    expect(validatePassword('short1')).toBe(
      'Password must be at least 8 characters with a letter and a number',
    )
    expect(validatePassword('longenough')).toBe(
      'Password must be at least 8 characters with a letter and a number',
    )
    expect(validatePassword('12345678')).toBe(
      'Password must be at least 8 characters with a letter and a number',
    )
  })

  it('accepts a qualifying password', () => {
    expect(validatePassword('Admin123!')).toBeNull()
  })
})
