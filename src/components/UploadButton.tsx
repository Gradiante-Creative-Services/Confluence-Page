import { useRef, useState } from 'react'
import { ApiError, uploadArtifactFiles, type UploadedFile } from '../api/client'

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
    <div className="upload-control">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="upload-input"
        aria-label="Choose files to upload"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <button
        type="button"
        className="btn-upload"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {isUploading ? 'Uploading…' : 'Upload files'}
      </button>
      {message && (
        <p className="upload-status upload-status-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="upload-status upload-status-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
