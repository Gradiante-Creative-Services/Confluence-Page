import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { ArtifactFolder, ArtifactStatus, CreateArtifactInput } from '../api/types'

interface NewArtifactModalProps {
  open: boolean
  pending: boolean
  error: string | null
  onClose: () => void
  onSubmit: (input: CreateArtifactInput) => Promise<void>
}

const folders: ArtifactFolder[] = ['docs', 'tests', 'ops', 'tools', 'comms']
const statuses: ArtifactStatus[] = ['draft', 'in_review', 'final']

export function NewArtifactModal({
  open,
  pending,
  error,
  onClose,
  onSubmit,
}: NewArtifactModalProps) {
  const titleId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [folder, setFolder] = useState<ArtifactFolder>('docs')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ArtifactStatus>('draft')

  useEffect(() => {
    if (open) {
      setName('')
      setFolder('docs')
      setDescription('')
      setStatus('draft')
      window.setTimeout(() => nameRef.current?.focus(), 0)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ name: name.trim(), folder, description: description.trim(), status })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>New artifact</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <p className="form-error form-error-general" role="alert">
              {error}
            </p>
          )}
          <div className="form-field">
            <label htmlFor="artifact-name">Name</label>
            <input
              ref={nameRef}
              id="artifact-name"
              className="form-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="artifact-folder">Folder</label>
            <select
              id="artifact-folder"
              className="form-input"
              value={folder}
              onChange={(event) => setFolder(event.target.value as ArtifactFolder)}
            >
              {folders.map((item) => (
                <option key={item} value={item}>
                  {item}/
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="artifact-status">Status</label>
            <select
              id="artifact-status"
              className="form-input"
              value={status}
              onChange={(event) => setStatus(event.target.value as ArtifactStatus)}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="artifact-description">Description</label>
            <textarea
              id="artifact-description"
              className="form-input"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={pending}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
