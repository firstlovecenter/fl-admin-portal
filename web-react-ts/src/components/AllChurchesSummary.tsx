import { Church, ChurchLevel } from 'global-types'
import { plural } from 'global-utils'
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from 'components/ui/card'

type AllChurchesSummaryProps = {
  church?: Church
  churchType: ChurchLevel | 'IC Bacenta'
  numberOfChurchesBelow: number
  route: string
  memberCount: number
}

const AllChurchesSummary = (props: AllChurchesSummaryProps) => {
  const { churchType, numberOfChurchesBelow, route, memberCount } = props

  return (
    <div className="mx-auto mt-4 grid w-full max-w-screen-sm grid-cols-2 gap-3 px-4">
      <Card className="rounded-2xl">
        <CardContent className="px-5 py-4">
          <div className="text-xs text-muted-foreground">
            {plural(churchType)}
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums text-primary">
            {numberOfChurchesBelow}
          </div>
        </CardContent>
      </Card>

      <Link
        to={`/${route}/members`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Card className="rounded-2xl transition-colors hover:bg-accent">
          <CardContent className="px-5 py-4">
            <div className="text-xs text-muted-foreground">Members</div>
            <div className="text-3xl font-bold tracking-tight tabular-nums text-primary">
              {memberCount}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

export default AllChurchesSummary
