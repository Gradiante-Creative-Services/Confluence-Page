import { z } from 'zod'

const folderIdSchema = z.enum(['docs', 'tests', 'ops', 'tools', 'comms'])

export const artifactListQuerySchema = z.object({
  folder: folderIdSchema.optional(),
  search: z.string().optional(),
  status: z.string().optional(),
})

export const artifactIdParamSchema = z.object({
  id: z.string().min(1),
})

export const createArtifactSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'id must be lowercase alphanumeric with hyphens'),
  folderId: folderIdSchema,
  name: z.string().min(1),
  path: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['Draft', 'Final', 'In Review']).default('Draft'),
  color: z.string().min(1),
})

export const updateArtifactSchema = z
  .object({
    folderId: folderIdSchema.optional(),
    name: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    status: z.enum(['Draft', 'Final', 'In Review']).optional(),
    color: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export type CreateArtifactInput = z.infer<typeof createArtifactSchema>
export type UpdateArtifactInput = z.infer<typeof updateArtifactSchema>
