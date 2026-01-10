import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { DISPLAY_MINISTRY } from './ReadQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Church } from 'global-types'
import DisplaySontaDetails from 'components/DisplayChurchDetails/DisplaySontaDetails'
import { permitAdmin } from 'permission-utils'
import { Container } from 'react-bootstrap'
import Breadcrumb from 'components/DisplayChurchDetails/Breadcrumb'
import { DetailsArray } from './DetailsBacenta'

const DetailsMinistry = () => {
  const { ministryId } = useContext(ChurchContext)

  const {
    data: ministryData,
    loading: ministryLoading,
    error: ministryError,
  } = useQuery(DISPLAY_MINISTRY, {
    variables: { id: ministryId },
  })
  const ministry = ministryData?.ministries[0]
  let breadcrumb: Church[]

  breadcrumb = [
    ministry?.creativeArts?.campus,
    ministry?.creativeArts,
    ministry,
  ]

  const churchCrumb = [ministry?.stream, ministry]

  const details: DetailsArray = [
    {
      title: 'Members',
      number: ministry?.memberCount,
      link: '/ministry/members',
      width: 12,
    },
    {
      title: 'Vacation Status',
      number: ministry?.vacationStatus,
      link: '#',
    },
    {
      title: 'Bank Account',
      number: ministry?.bankAccount,
      link: '#',
    },
    {
      title: 'Hub Councils',
      number: ministry?.hubCouncilCount,
      link: 'hubcouncil/displayall',
    },
    {
      title: 'Hubs',
      number: ministry?.hubCount,
      link: '/hub/displayall',
    },
    {
      title: 'Hub Fellowships',
      number: ministry?.activeHubFellowshipCount,
      vacationCount: ministry?.vacationHubFellowshipCount,
      link: '/ministry/hubfellowships',
    },
  ]

  return (
    <ApolloWrapper
      loading={ministryLoading}
      error={ministryError}
      data={ministryData}
    >
      <>
        <Container className="green">
          {ministry?.stream && <Breadcrumb breadcrumb={churchCrumb} />}
        </Container>
        <DisplaySontaDetails
          details={details}
          church={ministry}
          loading={ministryLoading}
          name={ministry?.name}
          leaderTitle="Ministry Leader"
          editPermitted={permitAdmin('CreativeArts')}
          churchId={ministryId}
          leader={ministry?.leader}
          admins={ministry?.admins}
          churchType="Ministry"
          subLevel="HubCouncil"
          editlink="/ministry/editministry"
          history={ministry?.history.length !== 0 && ministry?.history}
          breadcrumb={breadcrumb && breadcrumb}
          buttons={ministry?.hubCouncils}
        />
      </>
    </ApolloWrapper>
  )
}

export default DetailsMinistry
