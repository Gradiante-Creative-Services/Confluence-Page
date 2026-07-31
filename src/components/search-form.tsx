import { Label } from '@/components/ui/label'
import { SidebarInput } from '@/components/ui/sidebar'
import { SearchIcon } from 'lucide-react'

interface SearchFormProps extends React.ComponentProps<'form'> {
  value: string
  onValueChange: (value: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function SearchForm({ value, onValueChange, inputRef, ...props }: SearchFormProps) {
  return (
    <form {...props}>
      <div className="relative">
        <Label htmlFor="artifact-search" className="sr-only">
          Search artifacts
        </Label>
        <SidebarInput
          ref={inputRef}
          id="artifact-search"
          placeholder="Go to folder…"
          className="h-8 pl-7"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  )
}
