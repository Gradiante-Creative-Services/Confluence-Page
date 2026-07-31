import { Separator } from '@/components/ui/separator'

interface StatusBarProps {
  visibleCount: number
}

export function StatusBar({ visibleCount }: StatusBarProps) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
        <span>
          branch: <span className="font-medium text-foreground">main</span>
        </span>
        <Separator orientation="vertical" className="h-3" />
        <span>
          {visibleCount} folder{visibleCount === 1 ? '' : 's'}
        </span>
        <Separator orientation="vertical" className="h-3" />
        <span>
          last sync: <span className="font-medium text-foreground">26 Jul 2026</span>
        </span>
      </div>
    </footer>
  )
}
