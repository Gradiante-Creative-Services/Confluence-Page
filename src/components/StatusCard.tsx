import { Fragment } from 'react'
import { sessionDates } from '@/data/artifacts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function StatusCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>ops/status/</CardDescription>
          </div>
          <Badge>starts tomorrow</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sessionDates.map((date, index) => {
            const [, weekday, day] = date.split(' ')

            return (
              <Fragment key={date}>
                {index > 0 && <Separator orientation="vertical" className="h-10" />}
                <div className="flex min-w-16 flex-col items-center gap-2 text-center">
                  <div
                    className={`size-4 rounded-full border-2 ${
                      index === 0
                        ? 'border-primary bg-primary/10'
                        : 'border-muted-foreground/40'
                    }`}
                  />
                  <div className="text-xs text-muted-foreground">
                    D{index + 1}
                    <br />
                    {weekday} {day}
                  </div>
                </div>
              </Fragment>
            )
          })}
        </div>

        <Separator />

        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p>
            Session <span className="font-medium">0 / 10</span> complete
          </p>
          <p>
            Next: <span className="font-medium">Day 1 · Mon Jul 27</span>
          </p>
          <p>
            Format: <span className="font-medium">Weekday evenings</span>
          </p>
          <p>
            Cohort: <span className="font-medium">ThoughtFocus developers</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
