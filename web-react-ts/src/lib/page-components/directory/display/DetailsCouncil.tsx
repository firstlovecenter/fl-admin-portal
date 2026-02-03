import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import { permitAdmin } from 'permission-utils'
import React, { useContext, useEffect } from 'react'
import { DISPLAY_COUNCIL } from './ReadQueries'
import useClickCard from 'hooks/useClickCard'
import { DetailsArray } from './DetailsBacenta'

const DetailsCouncil = () => {
  const { councilId } = useContext(ChurchContext)
  const { setChurch } = useClickCard()
  const { data, loading, error } = useQuery(DISPLAY_COUNCIL, {
    variables: { id: councilId },
  })

  const council = data?.councils[0]
  let breadcrumb = [council?.stream, council]
  useEffect(() => {
    setChurch({ church: council?.stream_name, subChurch: 'bacenta' })
  }, [council?.stream_name, setChurch])

  const details: DetailsArray = [
    {
      title: 'Members',
      number: council?.memberCount || 0,
      link: `/${council?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: 'Governorships',
      number: council?.governorshipCount || 0,
      link: `/${`Governorship`.toLowerCase()}/displayall`,
    },
    { title: 'Target', number: council?.target, link: '#' },
    { title: 'Pastors', number: council?.pastorCount, link: '#' },
    {
      title: 'Greens',
      number: council?.activeGraduatedBacentaCount,
      vacationCount: council?.vacationGraduatedBacentaCount,
      link: `#`,
    },
    {
      title: 'Reds',
      number: council?.activeIcBacentaCount,
      vacationCount: council?.vacationIcBacentaCount,
      link: '#',
    },
    {
      title: 'Hub Councils',
      number: council?.hubCouncilCount,
      link: `/council/hubcouncils`,
      creativearts: true,
    },
    {
      title: 'Hubs',
      number: council?.hubCount,
      link: '#',
      creativearts: true,
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        loading={loading}
        name={council?.name}
        leaderTitle="Council Leader"
        churchId={councilId}
        leader={council?.leader}
        admin={council?.admin}
        churchType={council?.__typename}
        subChurch="Governorship"
        details={details}
        editlink="/council/editcouncil"
        editPermitted={permitAdmin('Stream')}
        history={council?.history.length !== 0 && council?.history}
        buttons={council ? council.governorships : []}
        breadcrumb={breadcrumb && breadcrumb}
      />
    </ApolloWrapper>
  )
}

export default DetailsCouncil
