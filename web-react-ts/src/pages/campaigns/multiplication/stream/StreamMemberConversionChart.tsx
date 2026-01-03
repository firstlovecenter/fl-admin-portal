import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import MemberConversionChart from '../MemberConversionChart'
import { STREAM_AGGREGATE_MEMBER_CONVERSION } from '../MultiplicationQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const StreamMemberConversionChart = () => {
  const { streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    STREAM_AGGREGATE_MEMBER_CONVERSION,
    {
      variables: {
        streamId: streamId,
      },
    }
  )
  const church = data?.streams[0]

  const aggregateMemberConversion = data?.streams[0]?.aggregateMemberConversion

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

export default StreamMemberConversionChart
