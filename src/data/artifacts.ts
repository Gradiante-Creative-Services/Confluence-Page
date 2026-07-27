import type { ArtifactCard } from '../types/artifact'

export const artifactCards: ArtifactCard[] = [
  {
    id: 'brd',
    name: 'BRD',
    path: 'docs/BRD/',
    folder: 'docs',
    color: 'var(--accent-string)',
    desc: 'Scope, objectives, and success metrics for the 10-session program.',
    owner: 'Sunil Soni',
    status: 'Final',
  },
  {
    id: 'arch',
    name: 'Architecture',
    path: 'docs/architecture/',
    folder: 'docs',
    color: 'var(--accent-keyword)',
    desc: 'Lab environment design, reference builds, and the RAG + MCP setup used in exercises.',
    owner: 'Sunil Soni',
    status: 'Final',
  },
]

export const sessionDates = [
  'Mon Jul 27',
  'Tue Jul 28',
  'Wed Jul 29',
  'Thu Jul 30',
  'Fri Jul 31',
  'Mon Aug 3',
  'Tue Aug 4',
  'Wed Aug 5',
  'Thu Aug 6',
  'Fri Aug 7',
]

export const sidebarFolders = [
  { id: 'all' as const, label: 'all', color: 'var(--text-primary)', icon: 'A' },
  { id: 'docs' as const, label: 'docs/', color: 'var(--accent-string)', icon: 'D' },
  { id: 'tests' as const, label: 'tests/', color: 'var(--accent-function)', icon: 'T' },
  { id: 'ops' as const, label: 'ops/', color: 'var(--accent-keyword)', icon: 'O' },
  { id: 'tools' as const, label: 'tools/', color: 'var(--accent-function)', icon: 'X' },
  { id: 'comms' as const, label: 'comms/', color: 'var(--accent-string)', icon: 'C' },
]
