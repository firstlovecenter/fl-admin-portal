import HeadingSecondary from 'components/HeadingSecondary'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import MemberConversionChart from '../MemberConversionChart'
import { TEAM_AGGREGATE_MEMBER_CONVERSION } from '../MultiplicationQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useQuery } from '@apollo/client'

function TeamMemberConversionChart() {
  const { teamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(TEAM_AGGREGATE_MEMBER_CONVERSION, {
    variables: {
      teamId: teamId,
    },
  })
  const church = data?.teams[0]

  const aggregateMemberConversion = data?.teams[0]?.aggregateMemberConversion

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <div className="text-center">
          <HeadingPrimary>{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Member Conversion Chart</HeadingSecondary>
        </div>
        <div>
          <MemberConversionChart
            aggregateMemberConversion={aggregateMemberConversion}
          />
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default TeamMemberConversionChart
