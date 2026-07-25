import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { DISPLAY_DENOMINATION } from './ReadQueries'

const DetailsDenomination = () => {
  const { t } = useTranslation()
  const { denominationId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(DISPLAY_DENOMINATION, {
    variables: { id: denominationId },
  })

  const denomination = data?.denominations[0]
  let breadcrumb = [denomination]

  const details = [
    {
      title: t('directory.detailsStats.members'),
      number: denomination?.memberCount || 0,
      link: `/${denomination?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: t('shared.churchLevelPlural.Stream'),
      number: denomination?.streamCount || 0,
      link: `#`,
    },
    {
      title: t('directory.detailsStats.pastors'),
      number: denomination?.pastorCount || '0',
      link: '#',
    },
    {
      title: t('shared.churchLevelPlural.Campus'),
      number: denomination?.campusCount,
      link: `/${`campus`.toLowerCase()}/displayall`,
    },
    {
      title: t('shared.churchLevelPlural.Council'),
      number: denomination?.councilCount,
      link: `#`,
    },
    {
      title: t('shared.churchLevelPlural.Governorship'),
      number: denomination?.governorshipCount,
      link: `/campus/governorships`,
    },
    {
      title: t('shared.churchLevelPlural.Bacenta'),
      number: denomination?.bacentaCount || 0,
      vacationCount: denomination?.vacationBacentaCount,
      link: '#',
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        name={denomination?.name}
        leaderTitle={t('directory.leaderTitle.leadPastor')}
        churchId={denominationId}
        leader={denomination?.leader}
        admin={denomination?.admin}
        churchType={denomination?.__typename}
        subChurch="Oversight"
        details={details}
        editlink="/denomination/editdenomination"
        editPermitted={['fishers']}
        history={denomination?.history.length !== 0 && denomination?.history}
        buttons={denomination?.oversights ?? []}
        breadcrumb={breadcrumb && breadcrumb}
        loading={loading}
      />
    </ApolloWrapper>
  )
}

export default DetailsDenomination
