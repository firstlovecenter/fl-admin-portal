import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'

import { DISPLAY_BACENTA, DISPLAY_BACENTA_HISTORY } from './ReadQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { permitAdminArrivals } from 'permission-utils'

import { MemberContext } from 'contexts/MemberContext'
import { check } from 'global-utils'

export type DetailsArray = {
  title: string
  number: number | string
  link: string
  width?: number
  creativearts?: boolean
  vacationCount?: number
  activeIcBacentaCount?: number
  vacationIcBacentaCount?: number
}[]

const convertToString = (value: string | boolean) => {
  if (value === true) {
    return 'In and Out'
  }

  return 'In Only'
}

const DetailsBacenta = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const { data, loading, error } = useQuery(DISPLAY_BACENTA, {
    variables: { id: bacentaId },
  })
  const { data: historyData } = useQuery(DISPLAY_BACENTA_HISTORY, {
    variables: { id: bacentaId },
  })
  const bacenta = data?.bacentas[0]
  const history = historyData?.bacentas[0]

  let breadcrumb = [
    bacenta?.governorship.council,
    bacenta?.governorship,
    bacenta,
  ]

  const details: DetailsArray = [
    {
      title: 'Members',
      number: bacenta?.memberCount || 0,
      link: `/${bacenta?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: 'Status',
      number: bacenta?.vacationStatus,
      link: '#',
    },
    {
      title: 'Meeting Day',
      number: bacenta?.meetingDay?.day,
      link: '#',
    },

    // {
    //   title: 'Target',
    //   number: bacenta?.target,
    //   link: '#',
    // },
    {
      title: 'Code',
      number: bacenta?.bankingCode,
      link: `#`,
    },
    {
      title: 'Momo Number',
      number: bacenta?.momoNumber || '-',
      link: `#`,
    },
    {
      title: 'Outbound Status',
      number: convertToString(bacenta?.outbound),
      link: `#`,
    },
    {
      title: 'Urvan Top Up (One Way)',
      number: bacenta?.urvanTopUp + ' ' + currentUser.currency,
      link: `#`,
    },
    {
      title: 'Sprinter Top Up (One Way)',
      number: bacenta?.sprinterTopUp + ' ' + currentUser.currency,
      link: `#`,
    },
  ]

  if (!bacenta?.urvanTopUp && bacenta?.sprinterTopUp) {
    details.splice(7, 1)
  }
  if (!bacenta?.sprinterTopUp && bacenta?.urvanTopUp) {
    details.splice(8, 1)
  }

  if (!bacenta?.sprinterTopUp && !bacenta?.urvanTopUp) {
    details.splice(6, 3)
    details.splice(5, 1)
  }

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        details={details}
        loading={loading}
        church={bacenta}
        momoNumber={bacenta?.momoNumber}
        name={bacenta?.name}
        leaderTitle="Bacenta Leader"
        leader={bacenta?.leader}
        location={bacenta?.location}
        last3Weeks={history && check(history)}
        churchId={bacentaId}
        churchType="Bacenta"
        editlink="/bacenta/editbacenta"
        editPermitted={permitAdminArrivals('Governorship')}
        history={history?.history.length !== 0 ? history?.history : []}
        breadcrumb={breadcrumb && breadcrumb}
        buttons={[]}
      />
    </ApolloWrapper>
  )
}

export default DetailsBacenta
