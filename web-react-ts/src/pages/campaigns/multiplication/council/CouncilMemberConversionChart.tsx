import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { COUNCIL_AGGREGATE_MEMBER_CONVERSION } from '../MultiplicationQueries'
import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import MemberConversionChart from '../MemberConversionChart'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

function CouncilMemberConversionChart() {
  const { councilId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    COUNCIL_AGGREGATE_MEMBER_CONVERSION,
    {
      variables: {
        councilId: councilId,
      },
    }
  )
  const church = data?.councils[0]

  const aggregateMemberConversion = data?.councils[0]?.aggregateMemberConversion

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

export default CouncilMemberConversionChart
