import { useRef, useState } from 'react'
import { ApiError, uploadArtifactFiles, type UploadedFile } from '@/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { UploadIcon } from 'lucide-react'

interface UploadButtonProps {
  onUploaded: (files: UploadedFile[]) => void
}

export function UploadButton({ onUploaded }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return

    setIsUploading(true)
    setMessage(null)
    setError(null)

    try {
      const result = await uploadArtifactFiles(Array.from(fileList))
      const count = result.files.length
      setMessage(`${count} file${count === 1 ? '' : 's'} uploaded to inbox`)
      onUploaded(result.files)
    } catch (err) {
      const text =
        err instanceof ApiError ? err.message : 'Upload failed. Please try again.'
      setError(text)
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        aria-label="Choose files to upload"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <Button disabled={isUploading} onClick={() => inputRef.current?.click()}>
        <UploadIcon data-icon="inline-start" />
        {isUploading ? 'Uploading…' : 'Upload files'}
      </Button>
      {message && (
        <Alert className="max-w-sm py-2">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="max-w-sm py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
