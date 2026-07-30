import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchArtifacts, fetchFolders } from '../api/client'
import type { ApiArtifact } from '../api/client'
import type { ArtifactCard } from '../types/artifact'
import { ArtifactCard as ArtifactCardView } from './ArtifactCard'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { StatusCard } from './StatusCard'
import { TitleBar } from './TitleBar'
import { UploadButton } from './UploadButton'
import type { SidebarFilter } from '../types/artifact'
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

export function ArtifactHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
      document.querySelector<HTMLInputElement>('.searchwrap input')?.focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <TitleBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="shell">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeFilter={activeFilter}
          folderCounts={folderCounts}
          onFilterChange={setActiveFilter}
        />

        <main>
          <div className="page-head">
            <div className="page-head-row">
              <h1>artifact-hub</h1>
              <UploadButton onUploaded={() => void loadData()} />
            </div>
            <p>
              Program deliverables for the AI for Developers cohort. Upload files here — they land
              in the Inbox and will be auto-assigned to folders based on content later.
            </p>
          </div>
          <StatusCard />

          {error && (
            <p className="form-error form-error-general hub-error" role="alert">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="hub-loading">Loading artifacts…</p>
          ) : (
            <div className="grid">
              {visibleCards.map((card) => (
                <ArtifactCardView key={card.id} card={card} />
              ))}
            </div>
          )}
        </main>
      </div>

      <StatusBar visibleCount={visibleCards.length} />
    </>
  )
}
