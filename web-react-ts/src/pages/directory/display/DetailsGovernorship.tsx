import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'

import { DISPLAY_GOVERNORSHIP } from './ReadQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdminArrivals } from 'permission-utils'
import { DetailsArray } from './DetailsBacenta'

const DetailsGovernorship = () => {
  const { governorshipId, setFilters } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(DISPLAY_GOVERNORSHIP, {
    variables: { id: governorshipId },
  })
  const governorship = data?.governorships[0]

  const details: DetailsArray = [
    {
      title: 'Members',
      number: governorship?.memberCount || 0,
      link: `/${governorship?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: 'Pastors',
      number: governorship?.pastorCount || '0',
      link: '/governorship/members',
      onClick: () => {
        setFilters({
          gender: [],
          maritalStatus: [],
          occupation: '',
          leaderTitle: ['Pastor'],
          leaderRank: [],
          basonta: [],
        })
        navigate('/governorship/members')
      },
    },
    {
      title: 'Bacentas',
      number: governorship?.bacentaCount || 0,
      link: `/bacenta/displayall`,
      vacationCount: governorship?.vacationBacentaCount,
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        details={details}
        loading={loading}
        name={data?.governorships[0]?.name}
        leaderTitle={'Governor'}
        leader={data?.governorships[0]?.leader}
        churchId={governorshipId}
        admin={data?.governorships[0]?.admin}
        churchType={`Governorship`}
        subChurch={`Bacenta`}
        buttons={data?.governorships[0]?.bacentas}
        editlink="/governorship/editgovernorship"
        editPermitted={permitAdminArrivals('Council')}
        history={
          data?.governorships[0]?.history.length !== 0 &&
          data?.governorships[0]?.history
        }
        breadcrumb={[data?.governorships[0]?.council, data?.governorships[0]]}
      />
    </ApolloWrapper>
  )
}

export default DetailsGovernorship
