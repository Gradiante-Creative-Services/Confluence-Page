import { useEffect, useMemo, useState } from 'react'
import { ArtifactCard } from './components/ArtifactCard'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { StatusCard } from './components/StatusCard'
import { TitleBar } from './components/TitleBar'
import { artifactCards } from './data/artifacts'
import type { SidebarFilter } from './types/artifact'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const folderCounts = useMemo(() => {
    const byFolder = { docs: 0, tests: 0, ops: 0, tools: 0, comms: 0 }
    artifactCards.forEach((card) => {
      byFolder[card.folder] += 1
    })

    return {
      all: artifactCards.length,
      ...byFolder,
    }
  }, [])

  const visibleCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return artifactCards.filter((card) => {
      const folderMatch = activeFilter === 'all' || card.folder === activeFilter
      const searchMatch =
        !query || `${card.name} ${card.desc}`.toLowerCase().includes(query)

      return folderMatch && searchMatch
    })
  }, [activeFilter, searchQuery])

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
            <h1>artifact-hub</h1>
            <p>
              Program deliverables for the AI for Developers cohort. Browse folders
              below — starting with BRD and Architecture. More artifact cards and
              upload support will be added next.
            </p>
          </div>

          <StatusCard />

          <div className="grid">
            {visibleCards.map((card) => (
              <ArtifactCard key={card.id} card={card} />
            ))}
          </div>
        </main>
      </div>

      <StatusBar visibleCount={visibleCards.length} />
    </>
  )
}

export default App
