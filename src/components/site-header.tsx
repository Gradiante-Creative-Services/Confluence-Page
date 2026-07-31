import { SearchForm } from '@/components/search-form'
import { HubUserMenu } from '@/components/hub-user-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { PanelLeftIcon } from 'lucide-react'

interface HubSiteHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  displayName: string
  email: string
  initials: string
  onLogout: () => void
}

export function HubSiteHeader({
  searchQuery,
  onSearchChange,
  searchInputRef,
  displayName,
  email,
  initials,
  onLogout,
}: HubSiteHeaderProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-14 w-full items-center gap-2 px-4">
        <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
          <PanelLeftIcon />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Separator orientation="vertical" className="mr-1 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>thoughtfocus-ai4dev / artifact-hub</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm
          className="w-full sm:ml-auto sm:w-64"
          value={searchQuery}
          onValueChange={onSearchChange}
          inputRef={searchInputRef}
        />
        <HubUserMenu
          displayName={displayName}
          email={email}
          initials={initials}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}
