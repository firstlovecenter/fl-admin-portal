import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DISPLAY_CAMPUS } from './ReadQueries'
import { permitAdmin } from 'permission-utils'
import { DetailsArray } from './DetailsBacenta'

const DetailsCampus = () => {
  const { t } = useTranslation()
  const { campusId, setFilters } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(DISPLAY_CAMPUS, {
    variables: { id: campusId },
  })

  const gathering = data?.campuses[0]
  let breadcrumb = [gathering?.oversight, gathering]

  const details: DetailsArray = [
    {
      title: t('directory.detailsStats.members'),
      number: gathering?.memberCount || 0,
      link: `/${gathering?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: t('directory.detailsStats.pastors'),
      number: gathering?.pastorCount || '0',
      link: '/campus/members',
      onClick: () => {
        setFilters({
          gender: [],
          maritalStatus: [],
          occupation: '',
          leaderTitle: ['Pastor'],
          leaderRank: [],
          basonta: [],
        })
        navigate('/campus/members')
      },
    },

    {
      title: t('shared.churchLevelPlural.Stream'),
      number: gathering?.streamCount || 0,
      link: `/${`Stream`.toLowerCase()}/displayall`,
    },
    {
      title: t('shared.churchLevelPlural.Council'),
      number: gathering?.councilCount,
      link: `/campus/councils`,
    },
    {
      title: t('shared.churchLevelPlural.Governorship'),
      number: gathering?.governorshipCount,
      link: `/campus/governorships`,
    },
    {
      title: t('shared.churchLevelPlural.Bacenta'),
      number: gathering?.bacentaCount || 0,
      vacationCount: gathering?.vacationBacentaCount,
      link: '#',
    },
    {
      title: t('directory.detailsStats.incomeTracking'),
      number: gathering?.noIncomeTracking
        ? t('directory.detailsStats.no')
        : t('directory.detailsStats.yes'),
      link: `#`,
    },
    {
      title: t('directory.detailsStats.currency'),
      number: gathering?.currency,
      link: `#`,
    },
    {
      title: t('directory.detailsStats.conversionRate'),
      number: gathering?.conversionRateToDollar,
      link: `#`,
    },
  ]

  // if noIncomeTracking is true, remove the last two elements in the array

  if (gathering?.noIncomeTracking) {
    details.pop()
    details.pop()
  }

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        name={gathering?.name}
        leaderTitle={t('directory.leaderTitle.campusLeader')}
        church={gathering}
        churchId={campusId}
        leader={gathering?.leader}
        churchType={gathering?.__typename}
        admin={gathering?.admin}
        subChurch="Stream"
        details={details}
        editlink="/campus/editcampus"
        editPermitted={permitAdmin('Oversight')}
        history={gathering?.history.length !== 0 && gathering?.history}
        buttons={gathering?.streams ?? []}
        breadcrumb={breadcrumb && breadcrumb}
        loading={loading}
      />
    </ApolloWrapper>
  )
}

export default DetailsCampus
