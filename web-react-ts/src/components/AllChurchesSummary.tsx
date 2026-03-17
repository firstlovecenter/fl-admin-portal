import { Church, ChurchLevel } from 'global-types'
import { plural } from 'global-utils'
import React from 'react'
import { Card, CardContent } from 'components/ui/card'
import { Link } from 'react-router-dom'
import './AllChurchesSummary.css'

type AllChurchesSummaryProps = {
  church?: Church
  churchType: ChurchLevel | 'IC Bacenta'
  numberOfChurchesBelow: number
  route: string
  memberCount: number
}

const AllChurchesSummary = (props: AllChurchesSummaryProps) => {
  const { church, churchType, numberOfChurchesBelow, route } = props

  return (
    <div className="mt-4 px-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Card className="mb-2 card-border">
            <CardContent className="summary-padding">
              <div className="text-muted-foreground text-sm">{plural(churchType)}</div>
              <div className="number">{numberOfChurchesBelow}</div>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1">
          <Card className="mb-2 card-border">
            <Link to={`/${route}/members`}>
              <CardContent className="summary-padding">
                <div className="text-muted-foreground text-sm">Members</div>
                <div className="number">{props?.memberCount}</div>
              </CardContent>
            </Link>
          </Card>
        </div>
        {churchType === 'Bacenta' || churchType === 'IC Bacenta' ? (
          <div className="flex-1">
            <Card className="mb-2 card-border">
              <Link to="/hub/displayall">
                <CardContent className="summary-padding">
                  <div className="text-muted-foreground text-sm">Hubs</div>
                  <div className="number">{church?.hubs?.length}</div>
                </CardContent>
              </Link>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AllChurchesSummary
