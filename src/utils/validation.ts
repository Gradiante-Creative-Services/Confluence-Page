const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const THOUGHTFOCUS_DOMAIN = '@thoughtfocus.com'

export function validateEmail(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Email is required'
  }

  if (!EMAIL_FORMAT.test(trimmed)) {
    return 'Enter a valid @thoughtfocus.com email'
  }

  if (!trimmed.toLowerCase().endsWith(THOUGHTFOCUS_DOMAIN)) {
    return 'Enter a valid @thoughtfocus.com email'
  }

  return null
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return 'Password is required'
  }

  if (value.length < 8) {
    return 'Password must be at least 8 characters with a letter and a number'
  }

  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return 'Password must be at least 8 characters with a letter and a number'
  }

  return null
}

const NAME_FORMAT = /^[a-zA-Z\s-]+$/

export function validateFirstName(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'First name is required'
  }

  if (!NAME_FORMAT.test(trimmed)) {
    return 'Use letters, spaces, or hyphens only'
  }

  return null
}

export function validateLastName(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Last name is required'
  }

  if (!NAME_FORMAT.test(trimmed)) {
    return 'Use letters, spaces, or hyphens only'
  }

  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) {
    return 'Confirm password is required'
  }

  if (password !== confirm) {
    return 'Passwords do not match'
  }

  return null
}
