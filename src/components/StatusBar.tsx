import { useAuth } from '../auth/AuthContext'

interface StatusBarProps {
  visibleCount: number
}

export function StatusBar({ visibleCount }: StatusBarProps) {
  const { session } = useAuth()

  return (
    <div className="statusbar">
      <span>
        branch: <b>main</b>
      </span>
      <span className="sep" aria-hidden="true">|</span>
      <span>
        {visibleCount} folder{visibleCount === 1 ? '' : 's'}
      </span>
      <span className="sep" aria-hidden="true">|</span>
      <span>
        last sync: <b>26 Jul 2026</b>
      </span>
      {session && (
        <>
          <span className="sep" aria-hidden="true">|</span>
          <span className="statusbar-user">{session.user.email}</span>
          <span className="sep" aria-hidden="true">|</span>
          <span>{`role: ${session.user.role}`}</span>
          <span className="sep" aria-hidden="true">|</span>
          <span>{`api: ${session.apiMode}`}</span>
        </>
      )}
    </div>
  )
}
