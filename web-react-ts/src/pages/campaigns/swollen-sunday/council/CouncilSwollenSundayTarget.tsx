import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { COUNCIL_SWOLLEN_TARGET_TEMPLATE } from '../SwollenSundayQueries'
import SwollenSundayTarget from '../SwollenSundayTarget'

const CouncilSwollenSundayTarget = () => {
  const { currentUser } = useContext(MemberContext)

  const { data, loading, error } = useQuery(COUNCIL_SWOLLEN_TARGET_TEMPLATE, {
    variables: {
      councilId: currentUser?.currentChurch.id,
    },
  })

  const bacentas = data?.councils[0]?.bacentas

  const swollenTargetTemplate = bacentas?.map((bacenta: any) => {
    return {
      governorship: bacenta?.governorship?.name,
      bacenta: bacenta?.name,
      code: bacenta?.code,
      leader: `${bacenta?.leader?.firstName} ${bacenta?.leader?.lastName}`,
      target: '',
    }
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <SwollenSundayTarget swollenTargetTemplate={swollenTargetTemplate} />
    </ApolloWrapper>
  )
}

export default CouncilSwollenSundayTarget
