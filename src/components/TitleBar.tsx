import { BrandMark } from './BrandMark'
import { useAuth } from '../auth/AuthContext'

interface TitleBarProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function TitleBar({
  sidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
}: TitleBarProps) {
  const { logout } = useAuth()

  return (
    <div className="titlebar">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label="Toggle explorer"
        title="Toggle explorer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>

      <div className="brand">
        <BrandMark size="sm" />
      </div>

      <div className="breadcrumb">
        thoughtfocus-ai4dev / <b>Confluence Page</b>
      </div>

      <div className="titlebar-end">
        <div className="searchwrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Go to folder…"
            aria-label="Search artifacts"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="kbd">/</span>
        </div>

        <button type="button" className="titlebar-signout" onClick={logout}>
          Sign out
        </button>
      </div>

      {sidebarCollapsed && <span className="sr-only">Sidebar collapsed</span>}
    </div>
  )
}
