import MenuButton from 'components/buttons/MenuButton'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { Church, UserRole } from 'global-types'
import SearchBadgeIcon from 'components/card/SearchBadgeIcon'

const ChurchList = ({
  color,
  link,
  includeVacation,
}: {
  color:
    | 'defaulters'
    | 'arrivals'
    | 'quick-facts'
    | 'churches'
    | 'maps'
    | 'accounts'
  link?: string
  includeVacation?: boolean
}) => {
  const { userJobs } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const { setUserChurch, setUserFinancials } = useSetUserChurch()
  const navigate = useNavigate()

  return (
    <div className="d-grid gap-2 text-left">
      {userJobs.length ? (
        userJobs.map((role: UserRole) =>
          role.church
            .filter((church: Church) => {
              if (includeVacation) return true
              return church?.vacationStatus !== 'Vacation'
            })
            .map((church: Church) => {
              if (color === 'arrivals') {
                if (
                  ![
                    'Bacenta',
                    'Governorship',
                    'Council',
                    'Stream',
                    'Campus',
                  ].includes(church.__typename)
                ) {
                  return null
                }
              }
              if (color === 'defaulters') {
                if (
                  ![
                    'Governorship',
                    'Council',
                    'Stream',
                    'Campus',
                    'Oversight',
                    'Denomination',
                    'CreativeArts',
                    'Ministry',
                    'HubCouncil',
                    'Hub',
                  ].includes(church.__typename)
                ) {
                  return null
                }
              }

              if (color === 'accounts') {
                if (
                  !['Oversight', 'Council', 'Campus'].includes(
                    church.__typename
                  )
                ) {
                  return null
                }
              }

              return (
                <MenuButton
                  key={church.id}
                  title={church.name}
                  iconComponent={
                    <SearchBadgeIcon category={church.__typename} size={20} />
                  }
                  iconBg={true}
                  noCaption
                  iconCaption={church.__typename}
                  onClick={() => {
                    clickCard(church)

                    if (church.__typename === 'Campus') {
                      setUserFinancials(church)
                    } else {
                      setUserChurch(church)
                    }

                    if (color === 'arrivals') {
                      navigate(`/arrivals/${church.__typename.toLowerCase()}`)
                    } else if (color === 'quick-facts') {
                      navigate(
                        `/quick-facts/this-month/${church.__typename.toLowerCase()}`
                      )
                    } else if (color === 'maps') {
                      navigate(`/maps/${church.__typename.toLowerCase()}`)
                    } else if (color === 'accounts') {
                      navigate(
                        `/accounts/${church.__typename.toLowerCase()}/dashboard`
                      )
                    } else {
                      navigate(link || '#')
                    }
                  }}
                  color={color}
                />
              )
            })
        )
      ) : (
        <>
          <MenuButton color={color} />
          <MenuButton color={color} />
          <MenuButton color={color} />
          <MenuButton color={color} />
        </>
      )}
    </div>
  )
}

export default ChurchList
