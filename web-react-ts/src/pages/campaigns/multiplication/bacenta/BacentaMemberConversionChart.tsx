import React, { useContext } from 'react'
import { BACENTA_AGGREGATE_MEMBER_CONVERSION } from '../MultiplicationQueries'
import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { Container } from 'react-bootstrap'
import MemberConversionChart from '../MemberConversionChart'

const BacentaMemberConversionChart = () => {
  const { bacentaId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    BACENTA_AGGREGATE_MEMBER_CONVERSION,
    {
      variables: {
        bacentaId: bacentaId,
      },
    }
  )
  const church = data?.bacentas[0]

  const aggregateMemberConversion = data?.bacentas[0]?.aggregateMemberConversion
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

export default BacentaMemberConversionChart
