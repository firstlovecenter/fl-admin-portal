import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'

import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { MemberContext } from 'contexts/MemberContext'
import Timeline from 'components/Timeline/Timeline'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { MEMBER_HISTORY } from './HistoryQueries'
import HeadingSecondary from 'components/HeadingSecondary'

function MemberHistory() {
  const { memberId } = useContext(MemberContext)
  const { data, loading, error } = useQuery(MEMBER_HISTORY, {
    variables: { id: memberId },
  })
  const member = data?.members[0]
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <>
        <div className="text-center">
          <HeadingPrimary>{`${member?.firstName} ${member?.lastName}`}</HeadingPrimary>
          <HeadingSecondary>History</HeadingSecondary>
        </div>

        <Container className="mt-5">
          <Timeline record={member?.history} limit={100} />
        </Container>
      </>
    </ApolloWrapper>
  )
}

export default MemberHistory
