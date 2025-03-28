import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { DISPLAY_CREATIVEARTS } from './ReadQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Church } from 'global-types'
import DisplaySontaDetails from 'components/DisplayChurchDetails/DisplaySontaDetails'
import { DetailsArray } from './DetailsBacenta'

const DetailsCreativeArts = () => {
  const { creativeArtsId } = useContext(ChurchContext)

  const {
    data: creativeArtsData,
    loading: creativeArtsLoading,
    error: creativeArtsError,
  } = useQuery(DISPLAY_CREATIVEARTS, {
    variables: { id: creativeArtsId },
  })
  const creativeArts = creativeArtsData?.creativeArts[0]

  let breadcrumb: Church[]

  breadcrumb = [creativeArts?.campus, creativeArts]

  const details: DetailsArray = [
    {
      title: 'Members',
      number: creativeArts?.memberCount,
      link: '/creativearts/members',
      width: 12,
    },
    {
      title: 'Ministries',
      number: creativeArts?.ministryCount,
      link: '/ministry/displayall',
    },
    {
      title: 'Hub Councils',
      number: creativeArts?.hubCouncilCount,
      link: '#',
    },
    {
      title: 'Hubs',
      number: creativeArts?.hubCount,
      link: '#',
    },
    {
      title: 'Hub Fellowships',
      number: creativeArts?.activeHubFellowshipCount,
      vacationCount: creativeArts?.vacationHubFellowshipCount,
      link: '#',
    },
  ]

  return (
    <ApolloWrapper
      loading={creativeArtsLoading}
      error={creativeArtsError}
      data={creativeArtsData}
    >
      <DisplaySontaDetails
        details={details}
        church={creativeArts}
        loading={creativeArtsLoading}
        name={creativeArts?.name}
        leaderTitle="Creative Arts Leader"
        editPermitted={['adminCampus']}
        churchId={creativeArtsId}
        leader={creativeArts?.leader}
        admin={creativeArts?.admin}
        churchType="CreativeArts"
        subLevel="Ministry"
        editlink="/creativearts/editcreativearts"
        history={creativeArts?.history.length !== 0 && creativeArts?.history}
        breadcrumb={breadcrumb && breadcrumb}
        buttons={creativeArts?.ministries}
      />
    </ApolloWrapper>
  )
}
export default DetailsCreativeArts
