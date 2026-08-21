import { z } from 'zod'

export const artifactFolders = ['docs', 'tests', 'ops', 'tools', 'comms'] as const
export const artifactStatuses = ['draft', 'in_review', 'final'] as const

export const createArtifactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  folder: z.enum(artifactFolders),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  status: z.enum(artifactStatuses).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
    .optional(),
  path: z.string().trim().min(1).max(500).optional(),
})

export const updateArtifactSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    folder: z.enum(artifactFolders).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    status: z.enum(artifactStatuses).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
      .optional(),
    path: z.string().trim().min(1).max(500).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })

export const listArtifactQuerySchema = z.object({
  folder: z.enum(artifactFolders).optional(),
  status: z.enum(artifactStatuses).optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
})

export function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) {
    throw new Error('Unable to derive a slug from name')
  }

  return slug
}

export function defaultArtifactPath(folder: string, slug: string): string {
  return `${folder}/${slug}/`
}
