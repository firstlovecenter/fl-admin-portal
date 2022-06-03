import { useQuery } from '@apollo/client'
import BaseComponent from 'components/base-component/BaseComponent'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { DISPLAY_GATHERINGSERVICE } from './ReadQueries'

const DetailsGatheringService = () => {
  const { gatheringServiceId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_GATHERINGSERVICE, {
    variables: { id: gatheringServiceId },
  })

  const gathering = data?.gatheringServices[0]
  let breadcrumb = [gathering]
  const details = [
    {
      title: 'Members',
      number: gathering?.memberCount || 0,
      link: `/${gathering?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: 'Streams',
      number: gathering?.streamCount || 0,
      link: `/${`Stream`.toLowerCase()}/displayall`,
    },
    { title: 'Target', number: gathering?.target, link: '#' },
    { title: 'Pastors', number: gathering?.pastorCount || '0', link: '#' },
    {
      title: 'Councils',
      number: gathering?.councilCount,
      link: `#`,
    },
    {
      title: 'Constituencies',
      number: gathering?.constituencyCount,
      link: `/gatheringservice/constituencies`,
    },
    {
      title: 'Bacentas',
      number: gathering?.activeBacentaCount,
      vacationCount: gathering?.vacationBacentaCount,
      link: `#`,
    },
    {
      title: 'Fellowships',
      number: gathering?.activeFellowshipCount,
      vacationCount: gathering?.vacationFellowshipCount,
      link: '#',
    },
  ]

  return (
    <BaseComponent loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        name={gathering?.name}
        leaderTitle="Resident Bishop"
        churchId={gatheringServiceId}
        leader={gathering?.leader}
        churchType={gathering?.__typename}
        subChurch="Stream"
        details={details}
        editlink="/stream/editstream"
        editPermitted={['adminGatheringService']}
        history={gathering?.history.length !== 0 && gathering?.history}
        buttons={gathering?.streams ?? []}
        breadcrumb={breadcrumb && breadcrumb}
        loading={loading}
      />
    </BaseComponent>
  )
}

export default DetailsGatheringService
