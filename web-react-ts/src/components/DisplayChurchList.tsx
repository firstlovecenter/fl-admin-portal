import { ChurchLevel, HigherChurch } from 'global-types'
import { capitalise } from 'global-utils'
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { Card, CardContent } from 'components/ui/card'
import { ChurchContext } from '../contexts/ChurchContext'
import CloudinaryImage from './CloudinaryImage'

const DisplayChurchList = (props: {
  data: HigherChurch[]
  churchType: ChurchLevel
}) => {
  const { data, churchType } = props
  const { clickCard } = useContext(ChurchContext)
  const { setUserFinancials } = useSetUserChurch()

  return (
    <div className="mx-auto mt-3 grid w-full max-w-screen-lg gap-3 px-4 sm:grid-cols-2 lg:grid-cols-3">
      {data?.map((church, index: number) => (
        <Link
          key={index}
          to={`/${church.__typename.toLowerCase()}/displaydetails`}
          onClick={() => {
            clickCard(church)
            if (churchType === 'Campus') {
              setUserFinancials(church)
            }
          }}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="shrink-0">
                <CloudinaryImage
                  className="img-search rounded-full"
                  src={church?.leader?.pictureUrl}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="church-title mt-0 truncate text-lg font-semibold">
                  {church.name}
                </h3>
                <div className="mt-1 space-y-1 text-xs">
                  <div className="text-title border-b border-border pb-1">
                    {church.leader
                      ? `${church.leader.firstName} ${church.leader.lastName}`
                      : null}
                    <span className="text-foreground">
                      {church.admin &&
                        ` | Admin: ${church.admin.firstName} ${church.admin.lastName}`}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {church.bacentaCount
                      ? `| ${church?.bacentaCount} Bacentas`
                      : null}{' '}
                    {church.governorshipCount
                      ? `| ${church?.governorshipCount} Governorships`
                      : null}{' '}
                    {church.councilCount
                      ? `| ${church?.councilCount} Councils`
                      : null}{' '}
                    {church.streamCount
                      ? `| ${church?.streamCount} Streams`
                      : null}{' '}
                    {church.hubCount ? `| ${church?.hubCount} Hubs` : null}{' '}
                    {church.ministryCount
                      ? `| ${church?.ministryCount} Ministries`
                      : null}{' '}
                    {church.memberCount
                      ? `| ${church?.memberCount} Members`
                      : null}{' '}
                    {church?.vacationStatus === 'Vacation' ? (
                      <span className="text-destructive">{`| ${church?.vacationStatus}`}</span>
                    ) : church.vacationStatus ? (
                      `| ${church?.vacationStatus}`
                    ) : null}{' '}
                    {churchType === 'Campus'
                      ? `${capitalise(church?.stream_name)}`
                      : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default DisplayChurchList
