import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { sidebarFolders } from '@/data/artifacts'
import type { SidebarFilter } from '@/types/artifact'
import { FolderIcon } from 'lucide-react'

interface HubAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeFilter: SidebarFilter
  folderCounts: Record<string, number>
  onFilterChange: (filter: SidebarFilter) => void
}

export function HubAppSidebar({
  activeFilter,
  folderCounts,
  onFilterChange,
  ...props
}: HubAppSidebarProps) {
  return (
    <Sidebar className="top-14 h-[calc(100svh-3.5rem)]!" {...props}>
      <SidebarHeader className="border-b px-4 py-3">
        <p className="text-sm font-medium">Explorer</p>
        <p className="text-xs text-muted-foreground">Filter by folder</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarFolders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    isActive={activeFilter === folder.id}
                    onClick={() => onFilterChange(folder.id)}
                  >
                    <FolderIcon />
                    <span>{folder.label}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{folderCounts[folder.id] ?? 0}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Program</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-1 text-xs leading-relaxed text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">AI for Developers</span> — ThoughtFocus
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">Owner:</span> Gradiante Creative Services
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">Run:</span> Jul 27 – Aug 7, 2026
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
