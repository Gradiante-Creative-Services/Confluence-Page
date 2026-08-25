import path from 'node:path'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { HttpError } from '../errors.ts'

const INGESTABLE_EXTENSIONS = new Set(['.txt', '.md', '.pdf', '.docx'])

export function isIngestableExtension(filename: string): boolean {
  return INGESTABLE_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

export async function extractDocumentText(
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const extension = path.extname(filename).toLowerCase()

  if (extension === '.txt' || extension === '.md') {
    return buffer.toString('utf8')
  }

  if (extension === '.pdf') {
    const parser = new PDFParse({ data: buffer })
    try {
      const parsed = await parser.getText()
      return parsed.text ?? ''
    } finally {
      await parser.destroy()
    }
  }

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value ?? ''
  }

  throw new HttpError(
    422,
    'unsupported_type',
    `Unsupported document type for ingestion: ${extension || '(none)'}`,
  )
}
