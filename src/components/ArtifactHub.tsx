import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { createArtifact, emptyFolderCounts, listArtifacts } from '../api/artifacts'
import type { ArtifactSummary, CreateArtifactInput } from '../api/types'
import { can } from '../auth/permissions'
import { useAuth } from '../auth/AuthContext'
import type { SidebarFilter } from '../types/artifact'
import { ArtifactCard } from './ArtifactCard'
import { ArtifactPanel } from './ArtifactPanel'
import { ChatPanel } from './ChatPanel'
import { NewArtifactModal } from './NewArtifactModal'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { StatusCard } from './StatusCard'
import { TitleBar } from './TitleBar'

export function ArtifactHub() {
  const { session } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([])
  const [folderCounts, setFolderCounts] = useState(emptyFolderCounts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)

  const canManage = session ? can(session.user.role, 'artifacts:manage') : false
  const canAsk = session ? can(session.user.role, 'chat:ask') : false
  const selectedArtifact = selectedId
    ? artifacts.find((artifact) => artifact.id === selectedId) ?? null
    : null

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      listArtifacts({
        folder: activeFilter,
        q: searchQuery.trim(),
        signal: controller.signal,
      })
        .then((result) => {
          if (controller.signal.aborted) return
          setArtifacts(result.data)
          setFolderCounts({
            all: result.meta.folderCounts?.all ?? result.meta.total,
            docs: result.meta.folderCounts?.docs ?? 0,
            tests: result.meta.folderCounts?.tests ?? 0,
            ops: result.meta.folderCounts?.ops ?? 0,
            tools: result.meta.folderCounts?.tools ?? 0,
            comms: result.meta.folderCounts?.comms ?? 0,
          })
          setError(null)
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return
          setError(caught instanceof ApiError ? caught.message : 'Could not load artifacts')
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [activeFilter, searchQuery, reloadToken])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.target instanceof HTMLInputElement) return
      event.preventDefault()
      document.querySelector<HTMLInputElement>('.searchwrap input')?.focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleCreate = async (input: CreateArtifactInput) => {
    setCreating(true)
    setCreateError(null)
    try {
      const created = await createArtifact(input)
      setModalOpen(false)
      setSelectedId(created.id)
      setReloadToken((value) => value + 1)
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'Could not create artifact')
    } finally {
      setCreating(false)
    }
  }

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
              <h1>Confluence Page</h1>
              <div className="page-head-actions">
                {canAsk && (
                  <button type="button" className="btn-admin" onClick={() => setChatOpen(true)}>
                    Ask docs
                  </button>
                )}
                {canManage && (
                  <button type="button" className="btn-admin" onClick={() => setModalOpen(true)}>
                    New artifact
                  </button>
                )}
              </div>
            </div>
            <p>
              Program deliverables for the AI for Developers cohort. Browse folders
              below — starting with BRD and Architecture.
            </p>
          </div>

          <StatusCard />

          {error && (
            <p className="form-error form-error-general" role="alert">
              {error}
            </p>
          )}

          {loading && <p className="contents-empty">Loading artifacts…</p>}

          {!loading && artifacts.length === 0 && !error && (
            <p className="contents-empty">No artifacts in this folder.</p>
          )}

          <div className="grid">
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                selected={selectedId === artifact.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>

          {selectedId && (
            <ArtifactPanel
              artifactId={selectedId}
              onClose={() => setSelectedId(null)}
              onChanged={() => setReloadToken((value) => value + 1)}
            />
          )}
        </main>
      </div>

      <StatusBar visibleCount={artifacts.length} />

      <NewArtifactModal
        open={modalOpen}
        pending={creating}
        error={createError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      {canAsk && (
        <ChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          selectedArtifactId={selectedId}
          selectedArtifactName={selectedArtifact?.name ?? null}
        />
      )}
    </>
  )
}
