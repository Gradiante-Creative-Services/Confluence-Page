import { z } from 'zod'

export const artifactFileParamsSchema = z.object({
  artifactId: z.string().min(1),
})

export const artifactFileDeleteParamsSchema = z.object({
  artifactId: z.string().min(1),
  fileId: z.coerce.number().int().positive(),
})

export const createArtifactFileSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  storagePath: z.string().min(1),
})

export type CreateArtifactFileInput = z.infer<typeof createArtifactFileSchema>
