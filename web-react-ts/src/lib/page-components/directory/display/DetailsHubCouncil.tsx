import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { DISPLAY_HUBCOUNCIL } from './ReadQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Church } from 'global-types'
import DisplaySontaDetails from 'components/DisplayChurchDetails/DisplaySontaDetails'
import { permitAdmin } from 'permission-utils'
import { Container } from 'react-bootstrap'
import Breadcrumb from 'components/DisplayChurchDetails/Breadcrumb'
import { DetailsArray } from './DetailsBacenta'

const DetailsHubCouncil = () => {
  const { hubCouncilId } = useContext(ChurchContext)

  const {
    data: hubData,
    loading: hubLoading,
    error: hubError,
  } = useQuery(DISPLAY_HUBCOUNCIL, {
    variables: { id: hubCouncilId },
  })
  const hubCouncil = hubData?.hubCouncils[0]
  let breadcrumb: Church[]

  breadcrumb = [
    hubCouncil?.ministry?.creativeArts?.campus,
    hubCouncil?.ministry?.creativeArts,
    hubCouncil?.ministry,
    hubCouncil,
  ]
  const churchCrumb = [hubCouncil?.council, hubCouncil]

  const details: DetailsArray = [
    {
      title: 'Members',
      number: hubCouncil?.memberCount,
      link: '/hubcouncil/members',
      width: 12,
    },
    {
      title: 'Hubs',
      number: hubCouncil?.hubs.length,
      link: '/hub/displayall',
    },
    {
      title: 'Hub Fellowship',
      number: hubCouncil?.activeHubFellowshipCount,
      vacationCount: hubCouncil?.vacationHubFellowshipCount,
      link: '#',
    },
  ]

  return (
    <ApolloWrapper loading={hubLoading} error={hubError} data={hubData}>
      <>
        <Container className="green">
          {hubCouncil?.council && <Breadcrumb breadcrumb={churchCrumb} />}
        </Container>
        <DisplaySontaDetails
          details={details}
          church={hubCouncil}
          loading={hubLoading}
          name={hubCouncil?.name}
          leaderTitle="Hub Council Leader"
          editPermitted={[...permitAdmin('Stream'), ...permitAdmin('Ministry')]}
          churchId={hubCouncilId}
          leader={hubCouncil?.leader}
          churchType="HubCouncil"
          subLevel="Hub"
          editlink="/hubcouncil/edithubcouncil"
          history={hubCouncil?.history.length !== 0 && hubCouncil?.history}
          breadcrumb={breadcrumb && breadcrumb}
          buttons={hubCouncil?.hubs}
        />
      </>
    </ApolloWrapper>
  )
}

export default DetailsHubCouncil
