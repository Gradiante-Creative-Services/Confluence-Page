interface StatusBarProps {
  visibleCount: number
}

export function StatusBar({ visibleCount }: StatusBarProps) {
  return (
    <div className="statusbar">
      <span>
        branch: <b>main</b>
      </span>
      <span className="sep">|</span>
      <span>
        {visibleCount} folder{visibleCount === 1 ? '' : 's'}
      </span>
      <span className="sep">|</span>
      <span>
        last sync: <b>26 Jul 2026</b>
      </span>
    </div>
  )
}
