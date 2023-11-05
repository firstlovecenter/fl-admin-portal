import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import DisplayChurchDetails from '../../../components/DisplayChurchDetails/DisplayChurchDetails'

import { DISPLAY_CONSTITUENCY } from './ReadQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdminArrivals } from 'permission-utils'
import { DetailsArray } from './DetailsFellowship'

const DetailsConstituency = () => {
  const { constituencyId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_CONSTITUENCY, {
    variables: { id: constituencyId },
  })
  const constituency = data?.constituencies[0]

  const details: DetailsArray = [
    {
      title: 'Members',
      number: constituency?.memberCount || 0,
      link: `/${constituency?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    { title: 'Target', number: constituency?.target, link: '#' },
    {
      title: 'Bacentas',
      number: constituency?.activeBacentaCount || 0,
      link: `/bacenta/displayall`,
      vacationCount: constituency?.vacationBacentaCount,
    },
    {
      title: 'IC Bacentas',
      number: constituency?.activeIcBacentaCount,
      vacationCount: constituency?.vacationIcBacentaCount,
      link: '/ic/displayall',
    },
    {
      title: 'Hubs',
      number: constituency?.hubCount,
      link: '/constituency/hubs',
      creativearts: true,
    },
    {
      title: 'Fellowships',
      number: constituency?.activeFellowshipCount,
      vacationCount: constituency?.vacationFellowshipCount,
      link: '#',
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        details={details}
        loading={loading}
        name={data?.constituencies[0]?.name}
        leaderTitle={'Constituency Leader'}
        leader={data?.constituencies[0]?.leader}
        churchId={constituencyId}
        admin={data?.constituencies[0]?.admin}
        churchType={`Constituency`}
        subChurch={`Bacenta`}
        buttons={data?.constituencies[0]?.bacentas}
        buttonsSecondRow={data?.constituencies[0]?.hubFellowships}
        editlink="/constituency/editconstituency"
        editPermitted={permitAdminArrivals('Council')}
        history={
          data?.constituencies[0]?.history.length !== 0 &&
          data?.constituencies[0]?.history
        }
        breadcrumb={[data?.constituencies[0]?.council, data?.constituencies[0]]}
        vacationCount={constituency?.vacationBacentaCount}
      />
    </ApolloWrapper>
  )
}

export default DetailsConstituency
