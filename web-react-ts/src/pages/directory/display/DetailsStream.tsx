import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import DisplayChurchDetails from 'components/DisplayChurchDetails/DisplayChurchDetails'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { DISPLAY_STREAM } from './ReadQueries'
import { permitAdmin } from 'permission-utils'
import { DetailsArray } from './DetailsBacenta'

const DetailsStream = () => {
  const { streamId, setFilters } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(DISPLAY_STREAM, {
    variables: { id: streamId },
  })

  const stream = data?.streams[0]
  let breadcrumb = [stream?.campus, stream]
  const details: DetailsArray = [
    {
      title: 'Members',
      number: stream?.memberCount || 0,
      link: `/${stream?.__typename?.toLowerCase()}/members`,
      width: 12,
    },
    {
      title: 'Meeting Day',
      number: stream?.meetingDay.day,
      link: '#',
    },
    {
      title: 'Vacation Status',
      number: stream?.vacationStatus,
      link: '#',
    },
    {
      title: 'Bank Account',
      number: stream?.bankAccount,
      link: '#',
    },
    {
      title: 'Councils',
      number: stream?.councilCount || 0,
      link: `/${`Council`.toLowerCase()}/displayall`,
    },
    {
      title: 'Pastors',
      number: stream?.pastorCount || '0',
      link: '/stream/members',
      onClick: () => {
        setFilters({
          gender: [],
          maritalStatus: [],
          occupation: '',
          leaderTitle: ['Pastor'],
          leaderRank: [],
          basonta: [],
        })
        navigate('/stream/members')
      },
    },
    {
      title: 'Governorships',
      number: stream?.governorshipCount,
      link: `/stream/governorships`,
    },
    {
      title: 'Bacentas',
      number: stream?.bacentaCount || 0,
      vacationCount: stream?.vacationBacentaCount,
      link: '/stream/bacentas',
    },
  ]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <DisplayChurchDetails
        name={stream?.name}
        church={stream}
        subChurch="Council"
        leaderTitle={'Stream Leader'}
        leader={stream?.leader}
        admins={stream?.admins}
        churchId={streamId}
        churchType={stream?.__typename}
        details={details}
        editlink="/stream/editstream"
        editPermitted={permitAdmin('Campus')}
        history={stream?.history.length !== 0 && stream?.history}
        buttons={stream?.councils ?? []}
        breadcrumb={breadcrumb && breadcrumb}
        loading={loading}
      />
    </ApolloWrapper>
  )
}

export default DetailsStream
