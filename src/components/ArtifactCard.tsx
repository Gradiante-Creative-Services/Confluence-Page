import type { CSSProperties } from 'react'
import type { ArtifactSummary } from '../api/types'
import { FOLDER_COLORS, STATUS_LABELS } from '../api/types'

const folderIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
)

interface ArtifactCardProps {
  artifact: ArtifactSummary
  selected: boolean
  onSelect: (id: string) => void
}

export function ArtifactCard({ artifact, selected, onSelect }: ArtifactCardProps) {
  return (
    <article
      className={`card${selected ? ' selected' : ''}`}
      data-folder={artifact.folder}
      data-id={artifact.id}
      style={{ '--card-color': FOLDER_COLORS[artifact.folder] } as CSSProperties}
    >
      <button
        type="button"
        className="card-button"
        onClick={() => onSelect(artifact.id)}
        aria-pressed={selected}
      >
        <div className="card-tab">
          <span className="folder-icon">{folderIcon}</span>
          <span className="card-name">{artifact.name}</span>
          <span className="item-count">{artifact.fileCount}</span>
        </div>

        <div className="card-path">{artifact.path}</div>

        <div className="card-body">
          <p className="card-desc">{artifact.description}</p>
          <div className={artifact.fileCount === 0 ? 'contents-empty' : 'contents-count'}>
            {artifact.fileCount === 0
              ? 'empty — upload a file to get started'
              : `${artifact.fileCount} file${artifact.fileCount === 1 ? '' : 's'}`}
          </div>
          <div className="card-meta">
            <span className="chip">{STATUS_LABELS[artifact.status]}</span>
          </div>
        </div>
      </button>
    </article>
  )
}
