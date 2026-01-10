import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { DISPLAY_OVERSIGHT } from './ReadQueries'
import { permitMe } from 'permission-utils'

const DetailsOversight = () => {
  const { oversightId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_OVERSIGHT, {
    variables: { id: oversightId },
  })

  const oversight = data?.oversights[0]
  let breadcrumb = [oversight?.denomination, oversight]

  const details = [
    {
      title: 'Members',
      number: oversight?.memberCount || 0,
      link: `/${oversight?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: 'Streams',
      number: oversight?.streamCount || 0,
      link: `#`,
    },
    { title: 'Pastors', number: oversight?.pastorCount || '0', link: '#' },
    {
      title: 'Campuses',
      number: oversight?.campusCount,
      link: `/${`campus`.toLowerCase()}/displayall`,
    },
    {
      title: 'Councils',
      number: oversight?.councilCount,
      link: `#`,
    },
    {
      title: 'Governorships',
      number: oversight?.governorshipCount,
      link: `/campus/governorships`,
    },
    {
      title: 'Greens',
      number: oversight?.activeGraduatedBacentaCount,
      vacationCount: oversight?.vacationGraduatedBacentaCount,
      link: `#`,
    },
    {
      title: 'Reds',
      number: oversight?.activeIcBacentaCount,
      vacationCount: oversight?.vacationIcBacentaCount,
      link: '#',
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        name={oversight?.name}
        leaderTitle="Oversight Leader"
        churchId={oversightId}
        leader={oversight?.leader}
        admins={oversight?.admins}
        churchType={oversight?.__typename}
        subChurch="Campus"
        details={details}
        editlink="/oversight/editoversight"
        editPermitted={permitMe('Denomination')}
        history={oversight?.history.length !== 0 && oversight?.history}
        buttons={oversight?.campuses ?? []}
        breadcrumb={breadcrumb && breadcrumb}
        loading={loading}
      />
    </ApolloWrapper>
  )
}

export default DetailsOversight
