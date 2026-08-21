const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const THOUGHTFOCUS_DOMAIN = '@thoughtfocus.com'

export function validateEmail(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Email is required'
  }

  if (!EMAIL_FORMAT.test(trimmed) || !trimmed.toLowerCase().endsWith(THOUGHTFOCUS_DOMAIN)) {
    return 'Enter a valid @thoughtfocus.com email'
  }

  return null
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return 'Password is required'
  }

  if (value.length < 8 || !/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return 'Password must be at least 8 characters with a letter and a number'
  }

  return null
}
