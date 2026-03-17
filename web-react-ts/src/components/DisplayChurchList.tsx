import { ChurchLevel, HigherChurch } from 'global-types'
import { capitalise } from 'global-utils'
import React, { useContext } from 'react'
import { Card, CardContent } from 'components/ui/card'
import { Link } from 'react-router-dom'
import { ChurchContext } from '../contexts/ChurchContext'
import CloudinaryImage from './CloudinaryImage'
import useSetUserChurch from 'hooks/useSetUserChurch'

const DisplayChurchList = (props: {
  data: HigherChurch[]
  churchType: ChurchLevel
}) => {
  const { data, churchType } = props
  const { clickCard } = useContext(ChurchContext)
  const { setUserFinancials } = useSetUserChurch()

  return (
    <div className="mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {data?.map((church, index: number) => {
          return (
            <div key={index}>
              <Link to={`/${church.__typename.toLowerCase()}/displaydetails`}>
                <Card
                  className="mb-2"
                  onClick={() => {
                    clickCard(church)
                    if (churchType === 'Campus') {
                      setUserFinancials(church)
                    }
                  }}
                >
                  <CardContent>
                    <div className="flex items-center px-3">
                      <div className="flex-none flex justify-center items-center">
                        <div className="flex-shrink-0">
                          <CloudinaryImage
                            className="rounded-circle img-search"
                            src={church?.leader?.pictureUrl}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="mt-0 church-title">
                          {church.name}
                        </h3>
                        <div className="pt-1 text-small card-padding">
                          <div className="d-block text-title border-bottom border-secondary">
                            {church.leader
                              ? `${church.leader.firstName} ${church.leader.lastName}`
                              : null}
                            <span className="text-white">
                              {church.admin &&
                                `| Admin: ${church.admin.firstName} ${church.admin.lastName}`}
                            </span>
                          </div>
                          <div className="text-muted d-block">
                            {church.fellowshipCount
                              ? `| ${church?.fellowshipCount} Fellowships`
                              : null}{' '}
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
                            {church.hubCount
                              ? `| ${church?.hubCount} Hubs`
                              : null}{' '}
                            {church.ministryCount
                              ? `| ${church?.ministryCount} Ministries`
                              : null}{' '}
                            {church.memberCount
                              ? `| ${church?.memberCount} Members`
                              : null}{' '}
                            {church?.target
                              ? `|Target: ${church.target}`
                              : null}
                            {church?.vacationStatus === 'Vacation' ? (
                              <span className="text-danger">{`| ${church?.vacationStatus}`}</span>
                            ) : church.vacationStatus ? (
                              `| ${church?.vacationStatus}`
                            ) : null}{' '}
                            {churchType === 'Campus'
                              ? `${capitalise(church?.stream_name)}`
                              : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DisplayChurchList
