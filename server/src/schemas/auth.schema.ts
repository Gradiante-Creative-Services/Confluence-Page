import { z } from 'zod'

export const thoughtfocusEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid @thoughtfocus.com email')
  .refine((value) => value.endsWith('@thoughtfocus.com'), {
    message: 'Enter a valid @thoughtfocus.com email',
  })

const nameSchema = z
  .string()
  .trim()
  .min(1, 'This field is required')
  .regex(/^[a-zA-Z\s-]+$/, 'Use letters, spaces, or hyphens only')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters with a letter and a number')
  .regex(
    /^(?=.*[a-zA-Z])(?=.*\d).+$/,
    'Password must be at least 8 characters with a letter and a number',
  )

export const loginSchema = z.object({
  email: thoughtfocusEmailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: thoughtfocusEmailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
