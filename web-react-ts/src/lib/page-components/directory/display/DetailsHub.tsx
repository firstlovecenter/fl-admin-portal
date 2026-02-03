import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { DISPLAY_HUB, DISPLAY_HUB_HISTORY } from './ReadQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Church, Hub } from 'global-types'
import DisplaySontaDetails from 'components/DisplayChurchDetails/DisplaySontaDetails'
import { permitAdmin } from 'permission-utils'
import { check } from 'global-utils'
import { Container } from 'react-bootstrap'
import Breadcrumb from 'components/DisplayChurchDetails/Breadcrumb'
import { DetailsArray } from './DetailsBacenta'

const DetailsHub = () => {
  const { hubId } = useContext(ChurchContext)

  const {
    data: hubData,
    loading: hubLoading,
    error: hubError,
  } = useQuery(DISPLAY_HUB, {
    variables: { id: hubId },
  })
  const { data: historyData } = useQuery(DISPLAY_HUB_HISTORY, {
    variables: { id: hubId },
  })
  const hub: Hub = hubData?.hubs[0]
  const history = historyData?.hubs[0]
  let breadcrumb: Church[]

  breadcrumb = [
    hub?.hubCouncil.ministry?.creativeArts?.campus,
    hub?.hubCouncil.ministry?.creativeArts,
    hub?.hubCouncil.ministry,
    hub?.hubCouncil,
    hub,
  ]

  const churchCrumb = [hub?.governorship, hub]

  const details: DetailsArray = [
    {
      title: 'Members',
      number: hub?.memberCount,
      link: '/hub/members',
      width: 12,
    },
    {
      title: 'Meeting Day',
      number: hub?.meetingDay?.day,
      link: '#',
    },
    {
      title: 'Status',
      number: hub?.vacationStatus,
      link: '#',
    },
    {
      title: 'Hub Fellowships',
      number: hub?.activeHubFellowshipCount,
      vacationCount: hub?.vacationHubFellowshipCount,
      link: '/hubfellowship/displayall',
    },
  ]

  return (
    <ApolloWrapper loading={hubLoading} error={hubError} data={hubData}>
      <>
        <Container className="green">
          {hub?.governorship && <Breadcrumb breadcrumb={churchCrumb} />}
        </Container>
        <DisplaySontaDetails
          details={details}
          church={hub}
          loading={hubLoading}
          name={hub?.name}
          leaderTitle="Hub Leader"
          editPermitted={[...permitAdmin('Stream'), ...permitAdmin('Ministry')]}
          churchId={hubId}
          leader={hub?.leader}
          location={hub?.location}
          churchType="Hub"
          editlink="/hub/edithub"
          history={hub?.history.length !== 0 ? hub?.history : []}
          last3Weeks={history && check(history)}
          breadcrumb={breadcrumb && breadcrumb}
          buttons={[]}
        />
      </>
    </ApolloWrapper>
  )
}

export default DetailsHub
