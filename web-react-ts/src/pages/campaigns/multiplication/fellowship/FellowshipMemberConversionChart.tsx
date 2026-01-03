import React, { useContext } from 'react'
import { FELLOWSHIP_AGGREGATE_MEMBER_CONVERSION } from '../MultiplicationQueries'
import { DocumentNode } from 'graphql'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { Container } from 'react-bootstrap'
import MemberConversionChart from '../MemberConversionChart'
import { useQuery } from '@apollo/client'

const FellowshipMemberConversionChart = () => {
  const { fellowshipId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    FELLOWSHIP_AGGREGATE_MEMBER_CONVERSION,
    {
      variables: {
        fellowshipId: fellowshipId,
      },
    }
  )
  const church = data?.fellowships[0]

  const aggregateMemberConversion =
    data?.fellowships[0]?.aggregateMemberConversion
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

export default FellowshipMemberConversionChart
