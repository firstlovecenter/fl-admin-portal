import HeadingSecondary from 'components/HeadingSecondary'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import MemberConversionChart from '../MemberConversionChart'
import { GOVERNORSHIP_AGGREGATE_MEMBER_CONVERSION } from '../MultiplicationQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useQuery } from '@apollo/client'

function GovernorshipMemberConversionChart() {
  const { governorshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    GOVERNORSHIP_AGGREGATE_MEMBER_CONVERSION,
    {
      variables: {
        governorshipId: governorshipId,
      },
    }
  )
  const church = data?.governorships[0]

  const aggregateMemberConversion =
    data?.governorships[0]?.aggregateMemberConversion

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

export default GovernorshipMemberConversionChart
