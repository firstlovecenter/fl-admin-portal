import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DISPLAY_OVERSIGHT } from './ReadQueries'
import { permitMe } from 'permission-utils'
import { DetailsArray } from './DetailsBacenta'

const DetailsOversight = () => {
  const { t } = useTranslation()
  const { oversightId, setFilters } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(DISPLAY_OVERSIGHT, {
    variables: { id: oversightId },
  })

  const oversight = data?.oversights[0]
  let breadcrumb = [oversight?.denomination, oversight]

  const details: DetailsArray = [
    {
      title: t('directory.detailsStats.members'),
      number: oversight?.memberCount || 0,
      link: `/${oversight?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: t('shared.churchLevelPlural.Stream'),
      number: oversight?.streamCount || 0,
      link: `#`,
    },
    {
      title: t('directory.detailsStats.pastors'),
      number: oversight?.pastorCount || '0',
      link: '/oversight/members',
      onClick: () => {
        setFilters({
          gender: [],
          maritalStatus: [],
          occupation: '',
          leaderTitle: ['Pastor'],
          leaderRank: [],
          basonta: [],
        })
        navigate('/oversight/members')
      },
    },
    {
      title: t('shared.churchLevelPlural.Campus'),
      number: oversight?.campusCount,
      link: `/${`campus`.toLowerCase()}/displayall`,
    },
    {
      title: t('shared.churchLevelPlural.Council'),
      number: oversight?.councilCount,
      link: `#`,
    },
    {
      title: t('shared.churchLevelPlural.Governorship'),
      number: oversight?.governorshipCount,
      link: `/campus/governorships`,
    },
    {
      title: t('shared.churchLevelPlural.Bacenta'),
      number: oversight?.bacentaCount || 0,
      vacationCount: oversight?.vacationBacentaCount,
      link: '#',
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        name={oversight?.name}
        leaderTitle={t('directory.leaderTitle.oversightLeader')}
        churchId={oversightId}
        leader={oversight?.leader}
        admin={oversight?.admin}
        churchType={oversight?.__typename}
        subChurch="Campus"
        details={details}
        editlink="/oversight/editoversight"
        editPermitted={permitMe('Denomination')}
        history={oversight?.history.length !== 0 && oversight?.history}
        buttons={oversight?.campuses ?? []}
        breadcrumb={breadcrumb && breadcrumb}
        loading={loading}
      />
    </ApolloWrapper>
  )
}

export default DetailsOversight
