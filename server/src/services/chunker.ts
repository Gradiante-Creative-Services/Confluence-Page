const CHUNK_SIZE = 600
const CHUNK_OVERLAP = 100

export function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  if (normalized.length <= size) {
    return [normalized]
  }

  const chunks: string[] = []
  let start = 0
  while (start < normalized.length) {
    const end = Math.min(start + size, normalized.length)
    chunks.push(normalized.slice(start, end))
    if (end >= normalized.length) break
    start = Math.max(0, end - overlap)
  }
  return chunks
}
