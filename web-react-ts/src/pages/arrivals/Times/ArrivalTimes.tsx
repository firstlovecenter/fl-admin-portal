import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import TableFromArrays from 'components/TableFromArrays/TableFromArrays'
import { MemberContext } from 'contexts/MemberContext'
import { parseNeoTime } from 'jd-date-utils'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { GET_ARRIVAL_TIMES } from './time-gql'
import { Button } from 'components/ui/button'

const ArrivalTimes = () => {
  const { currentUser } = useContext(MemberContext)
  const church = currentUser?.currentChurch
  const { data, loading, error } = useQuery(GET_ARRIVAL_TIMES, {
    variables: { id: church?.id },
  })
  const stream = data?.streams[0]
  const navigate = useNavigate()

  const table = [
    ['Mobilisation Start', parseNeoTime(stream?.mobilisationStartTime) || ''],
    ['Mobilisation End', parseNeoTime(stream?.mobilisationEndTime) || ''],
    ['Arrival Start', parseNeoTime(stream?.arrivalStartTime) || ''],
    ['Arrival End', parseNeoTime(stream?.arrivalEndTime) || ''],
  ]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <HeadingPrimary>Arrival Times</HeadingPrimary>
        <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>

        <Button
          onClick={() => navigate('/stream/set-arrivals-time')}
          className="mb-4"
        >
          Edit Times
        </Button>
        <TableFromArrays tableArray={table} loading={loading} />
      </div>
    </ApolloWrapper>
  )
}

export default ArrivalTimes
