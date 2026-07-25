import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
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
  vacationCount?: number
  onClick?: () => void
}[]

const convertToString = (value: string | boolean, t: TFunction) => {
  if (value === true) {
    return t('directory.detailsStats.inAndOut')
  }

  return t('directory.detailsStats.inOnly')
}

const DetailsBacenta = () => {
  const { t } = useTranslation()
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
      title: t('directory.detailsStats.members'),
      number: bacenta?.memberCount || 0,
      link: `/${bacenta?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: t('directory.detailsStats.status'),
      number: bacenta?.vacationStatus,
      link: '#',
    },
    {
      title: t('directory.detailsStats.meetingDay'),
      number: bacenta?.meetingDay?.day,
      link: '#',
    },

    {
      title: t('directory.detailsStats.code'),
      number: bacenta?.bankingCode,
      link: `#`,
    },
    {
      title: t('directory.detailsStats.momoNumber'),
      number: bacenta?.momoNumber || '-',
      link: `#`,
    },
    {
      title: t('directory.detailsStats.outboundStatus'),
      number: convertToString(bacenta?.outbound, t),
      link: `#`,
    },
    {
      title: t('directory.detailsStats.urvanTopUp'),
      number: bacenta?.urvanTopUp + ' ' + currentUser.currency,
      link: `#`,
    },
    {
      title: t('directory.detailsStats.sprinterTopUp'),
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
        leaderTitle={t('directory.leaderTitle.bacentaLeader')}
        leader={bacenta?.leader}
        admin={bacenta?.admin}
        deputyLeader={bacenta?.deputyLeader}
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
