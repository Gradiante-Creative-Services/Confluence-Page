export type ArtifactFolder = 'docs' | 'tests' | 'ops' | 'tools' | 'comms'

export interface ArtifactCard {
  id: string
  name: string
  path: string
  folder: ArtifactFolder
  color: string
  desc: string
  owner: string
  status: string
}

export type SidebarFilter = 'all' | ArtifactFolder
