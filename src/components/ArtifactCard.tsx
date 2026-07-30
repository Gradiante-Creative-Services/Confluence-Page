import type { ArtifactCard as ArtifactCardType } from '../types/artifact'

const folderIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
)

interface ArtifactCardProps {
  card: ArtifactCardType
}

export function ArtifactCard({ card }: ArtifactCardProps) {
  return (
    <article
      className="card"
      data-folder={card.folder}
      data-id={card.id}
      style={{ '--card-color': card.color } as React.CSSProperties}
    >
      <div className="card-tab">
        <span className="folder-icon">{folderIcon}</span>
        <span className="card-name">{card.name}</span>
        <span className="item-count">{card.fileCount}</span>
      </div>

      <div className="card-path">{card.path}</div>

      <div className="card-body">
        <p className="card-desc">{card.desc}</p>
        {card.fileCount === 0 ? (
          <div className="contents-empty">empty</div>
        ) : (
          <div className="contents-empty">{card.fileCount} file{card.fileCount === 1 ? '' : 's'}</div>
        )}
        <div className="card-meta">
          <span className="chip">{card.status}</span>
        </div>
      </div>
    </article>
  )
}
