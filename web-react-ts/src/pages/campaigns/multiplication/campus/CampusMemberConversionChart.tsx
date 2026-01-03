import HeadingSecondary from 'components/HeadingSecondary'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import MemberConversionChart from '../MemberConversionChart'
import { ChurchContext } from 'contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { CAMPUS_AGGREGATE_MEMBER_CONVERSION } from '../MultiplicationQueries'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const CampusMemberConversionChart = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    CAMPUS_AGGREGATE_MEMBER_CONVERSION,
    {
      variables: {
        campusId: campusId,
      },
    }
  )
  const church = data?.campuses[0]

  const aggregateMemberConversion = data?.campuses[0]?.aggregateMemberConversion

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

export default CampusMemberConversionChart
