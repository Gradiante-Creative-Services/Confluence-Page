import type { ArtifactCard as ArtifactCardType } from '@/types/artifact'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FolderIcon } from 'lucide-react'

interface ArtifactCardProps {
  card: ArtifactCardType
}

export function ArtifactCard({ card }: ArtifactCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderIcon className="size-4 text-muted-foreground" />
            <CardTitle>{card.name}</CardTitle>
          </div>
          <Badge variant="secondary">{card.fileCount}</Badge>
        </div>
        <CardDescription>{card.path}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{card.desc}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {card.fileCount === 0
            ? 'No files yet'
            : `${card.fileCount} file${card.fileCount === 1 ? '' : 's'}`}
        </p>
      </CardContent>
      <CardFooter>
        <Badge variant="outline">{card.status}</Badge>
      </CardFooter>
    </Card>
  )
}
