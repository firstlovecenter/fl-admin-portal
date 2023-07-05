import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { DISPLAY_MINISTRY } from './ReadQueries'
import { ChurchContext } from '../../../contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Church } from 'global-types'
import DisplaySontaDetails from 'components/DisplayChurchDetails/DisplaySontaDetails'
import { DetailsArray } from './DetailsFellowship'
import { permitAdmin } from 'permission-utils'

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

  const details: DetailsArray = [
    {
      title: 'Members',
      number: ministry?.memberCount,
      link: '#',
      width: 12,
    },
    {
      title: 'Hubs',
      number: ministry?.hubCount,
      link: '/hub/displayall',
    },
    {
      title: 'Sontas',
      number: ministry?.sontaCount,
      link: '/ministry/sontas',
    },
  ]

  return (
    <ApolloWrapper
      loading={ministryLoading}
      error={ministryError}
      data={ministryData}
    >
      <DisplaySontaDetails
        details={details}
        church={ministry}
        loading={ministryLoading}
        name={ministry?.name}
        leaderTitle="Ministry Leader"
        editPermitted={permitAdmin('CreativeArts')}
        churchId={ministryId}
        leader={ministry?.leader}
        churchType="Ministry"
        subLevel="Hub"
        editlink="/ministry/editministry"
        history={ministry?.history.length !== 0 && ministry?.history}
        breadcrumb={breadcrumb && breadcrumb}
        buttons={ministry?.hubs}
      />
    </ApolloWrapper>
  )
}

export default DetailsMinistry
