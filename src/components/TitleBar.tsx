import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface TitleBarProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
}

function getInitials(displayName: string | null, email: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
  }

  return email.slice(0, 2).toUpperCase()
}

export function TitleBar({
  sidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
}: TitleBarProps) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = user?.displayName ?? user?.email.split('@')[0] ?? 'User'
  const email = user?.email ?? ''

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

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
        <span className="brand-text">ThoughtFocus</span>
        <div className="brand-div" />
        <div className="dots">
          <span className="d1" />
          <span className="d2" />
          <span className="d3" />
        </div>
      </div>

      <div className="breadcrumb">
        thoughtfocus-ai4dev / <b>artifact-hub</b>
      </div>

      <div className="titlebar-actions">
        <div className="searchwrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Go to folder…"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="kbd">/</span>
        </div>

        {user && (
          <div className="profile-menu" ref={menuRef}>
            <button
              type="button"
              className="profile-trigger"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="profile-avatar" aria-hidden="true">
                {getInitials(user.displayName, user.email)}
              </span>
              <span className="profile-trigger-label">{displayName}</span>
              <svg
                className={`profile-chevron${menuOpen ? ' open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-head">
                  <p className="profile-dropdown-name">{displayName}</p>
                  <p className="profile-dropdown-email">{email}</p>
                </div>
                <button
                  type="button"
                  className="profile-dropdown-signout"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {sidebarCollapsed && <span className="sr-only">Sidebar collapsed</span>}
    </div>
  )
}
