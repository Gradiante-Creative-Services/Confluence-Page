import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FolderOpenIcon, SparklesIcon, UploadIcon } from 'lucide-react'
import gradianteLogo from '../assets/gradiante-logo.png'
import thoughtfocusLogo from '../assets/thoughtfocus-logo.png'

interface LandingPageProps {
  onSignIn: () => void
  onSignUp: () => void
}

const features = [
  {
    icon: FolderOpenIcon,
    title: 'Organized deliverables',
    description: 'Browse BRD, architecture, tests, and ops artifacts in one structured hub.',
  },
  {
    icon: UploadIcon,
    title: 'Upload anything',
    description: 'Drop files into the inbox — auto-assignment to folders comes next.',
  },
  {
    icon: SparklesIcon,
    title: 'AI for Developers',
    description: 'Ten-session cohort covering RAG, MCP, and practical AI engineering workflows.',
  },
]

export function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <img
          src={thoughtfocusLogo}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-contain p-16 opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-muted to-muted" />
        <div className="relative flex h-full flex-col justify-end p-10">
          <div className="flex items-center gap-3">
            <img src={thoughtfocusLogo} alt="ThoughtFocus" className="h-8 w-auto" />
            <Separator orientation="vertical" className="h-6" />
            <img src={gradianteLogo} alt="Gradiante" className="size-9 rounded-md" />
          </div>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            thoughtfocus-ai4dev / artifact-hub
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6 md:p-10 lg:justify-center">
        <div className="flex items-center gap-3 lg:hidden">
          <img src={thoughtfocusLogo} alt="ThoughtFocus" className="h-7 w-auto" />
          <img src={gradianteLogo} alt="Gradiante" className="size-8 rounded-md" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">AI for Developers</Badge>
            <Badge variant="outline">Jul 27 – Aug 7, 2026</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Artifact Hub</h1>
          <p className="max-w-lg text-muted-foreground">
            Program deliverables for the ThoughtFocus AI for Developers cohort. Sign in to
            browse folders, upload files, and track session progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onSignIn}>Sign in</Button>
          <Button variant="outline" onClick={onSignUp}>
            Create account
          </Button>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} size="sm">
              <CardHeader>
                <feature.icon className="size-5 text-muted-foreground" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
