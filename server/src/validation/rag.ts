import { z } from 'zod'

export const ragFileIdParamSchema = z.object({
  fileId: z.string().trim().min(1, 'fileId is required'),
})
