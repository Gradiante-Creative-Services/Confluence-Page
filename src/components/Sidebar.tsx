import type { CSSProperties } from 'react'
import { sidebarFolders } from '../data/artifacts'
import type { SidebarFilter } from '../types/artifact'

interface SidebarProps {
  collapsed: boolean
  activeFilter: SidebarFilter
  folderCounts: Record<string, number>
  onFilterChange: (filter: SidebarFilter) => void
}

export function Sidebar({
  collapsed,
  activeFilter,
  folderCounts,
  onFilterChange,
}: SidebarProps) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-title">Explorer</div>

      {sidebarFolders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className={`folder-btn${activeFilter === folder.id ? ' active' : ''}`}
          style={{ '--folder-color': folder.color } as CSSProperties}
          title={folder.label}
          onClick={() => onFilterChange(folder.id)}
        >
          <span className="ficon">{folder.icon}</span>
          <span className="fname">{folder.label}</span>
          <span className="folder-count">{folderCounts[folder.id] ?? 0}</span>
        </button>
      ))}

      <div className="sidebar-note">
        <b>program</b>
        <br />
        AI for Developers — ThoughtFocus
        <br />
        <br />
        <b>owner</b>
        <br />
        Gradiante Creative Services
        <br />
        <br />
        <b>run</b>
        <br />
        Jul 27 – Aug 7, 2026 · weekday evenings
      </div>
    </aside>
  )
}
