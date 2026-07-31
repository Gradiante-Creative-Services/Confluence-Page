import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchArtifacts, fetchFolders } from '@/api/client'
import type { ApiArtifact } from '@/api/client'
import type { ArtifactCard } from '@/types/artifact'
import type { SidebarFilter } from '@/types/artifact'
import { useAuth } from '@/context/AuthContext'
import { ArtifactCard as ArtifactCardView } from '@/components/ArtifactCard'
import { HubAppSidebar } from '@/components/app-sidebar'
import { HubSiteHeader } from '@/components/site-header'
import { StatusBar } from '@/components/StatusBar'
import { StatusCard } from '@/components/StatusCard'
import { UploadButton } from '@/components/UploadButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

function mapArtifact(artifact: ApiArtifact): ArtifactCard {
  return {
    id: artifact.id,
    name: artifact.name,
    path: artifact.path,
    folder: artifact.folderId as ArtifactCard['folder'],
    color: artifact.color,
    desc: artifact.description,
    status: artifact.status,
    fileCount: artifact.fileCount,
  }
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

export function ArtifactHub() {
  const { user, logout } = useAuth()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [artifacts, setArtifacts] = useState<ArtifactCard[]>([])
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({
    all: 0,
    docs: 0,
    tests: 0,
    ops: 0,
    tools: 0,
    comms: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [artifactsResponse, foldersResponse] = await Promise.all([
        fetchArtifacts(),
        fetchFolders(),
      ])

      setArtifacts(artifactsResponse.artifacts.map(mapArtifact))

      const counts: Record<string, number> = {
        all: artifactsResponse.total,
        docs: 0,
        tests: 0,
        ops: 0,
        tools: 0,
        comms: 0,
      }

      for (const folder of foldersResponse.folders) {
        counts[folder.id] = folder.artifactCount
      }

      setFolderCounts(counts)
    } catch {
      setError('Unable to load artifacts. Make sure the API server is running.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const visibleCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return artifacts.filter((card) => {
      const folderMatch = activeFilter === 'all' || card.folder === activeFilter
      const searchMatch =
        !query || `${card.name} ${card.desc}`.toLowerCase().includes(query)

      return folderMatch && searchMatch
    })
  }, [activeFilter, artifacts, searchQuery])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.target instanceof HTMLInputElement) return
      event.preventDefault()
      searchInputRef.current?.focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const displayName = user?.displayName ?? user?.email.split('@')[0] ?? 'User'
  const email = user?.email ?? ''

  return (
    <SidebarProvider>
      <HubSiteHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        displayName={displayName}
        email={email}
        initials={getInitials(user?.displayName ?? null, email)}
        onLogout={logout}
      />
      <div className="flex flex-1">
        <HubAppSidebar
          activeFilter={activeFilter}
          folderCounts={folderCounts}
          onFilterChange={setActiveFilter}
        />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-6 pb-16">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">artifact-hub</h1>
                <p className="text-sm text-muted-foreground">
                  Program deliverables for the AI for Developers cohort. Upload files to the
                  Inbox — auto-assignment based on content is coming next.
                </p>
              </div>
              <UploadButton onUploaded={() => void loadData()} />
            </div>

            <StatusCard />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleCards.map((card) => (
                  <ArtifactCardView key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
      <StatusBar visibleCount={visibleCards.length} />
    </SidebarProvider>
  )
}
