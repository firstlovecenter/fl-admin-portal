import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { DISPLAY_DENOMINATION } from './ReadQueries'

const DetailsDenomination = () => {
  const { denominationId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_DENOMINATION, {
    variables: { id: denominationId },
  })

  const denomination = data?.denominations[0]
  let breadcrumb = [denomination]

  const details = [
    {
      title: 'Members',
      number: denomination?.memberCount || 0,
      link: `/${denomination?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: 'Streams',
      number: denomination?.streamCount || 0,
      link: `#`,
    },
    { title: 'Pastors', number: denomination?.pastorCount || '0', link: '#' },
    {
      title: 'Campuses',
      number: denomination?.campusCount,
      link: `/${`campus`.toLowerCase()}/displayall`,
    },
    {
      title: 'Councils',
      number: denomination?.councilCount,
      link: `#`,
    },
    {
      title: 'Constituencies',
      number: denomination?.constituencyCount,
      link: `/campus/constituencies`,
    },
    {
      title: 'Bacentas',
      number: denomination?.activeGraduatedBacentaCount,
      vacationCount: denomination?.vacationGraduatedBacentaCount,
      link: `#`,
    },
    {
      title: 'ICs',
      number: denomination?.activeIcBacentaCount,
      vacationCount: denomination?.vacationIcBacentaCount,
      link: '#',
    },
    {
      title: 'Fellowships',
      number: denomination?.activeFellowshipCount,
      vacationCount: denomination?.vacationFellowshipCount,
      link: '#',
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        name={denomination?.name}
        leaderTitle="Lead Pastor"
        churchId={denominationId}
        leader={denomination?.leader}
        admin={denomination?.admin}
        churchType={denomination?.__typename}
        subChurch="Oversight"
        details={details}
        editlink="/denomination/editdenomination"
        editPermitted={['fishers']}
        history={denomination?.history.length !== 0 && denomination?.history}
        buttons={denomination?.oversights ?? []}
        breadcrumb={breadcrumb && breadcrumb}
        loading={loading}
      />
    </ApolloWrapper>
  )
}

export default DetailsDenomination
