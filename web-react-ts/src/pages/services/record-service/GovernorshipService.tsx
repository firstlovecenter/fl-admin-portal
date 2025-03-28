import React, { useContext } from 'react'
import { ChurchContext } from '../../../contexts/ChurchContext'

import { useMutation, useQuery } from '@apollo/client'
import {
  RECORD_SERVICE,
  RECORD_SERVICE_NO_INCOME,
} from './RecordServiceMutations'
import { DISPLAY_GOVERNORSHIP } from '../../directory/display/ReadQueries'
import ServiceForm from './ServiceForm'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { MemberContext } from '../../../contexts/MemberContext'
import ServiceFormNoIncome from './ServiceFormNoIncome'

const GovernorshipService = () => {
  const { currentUser } = useContext(MemberContext)

  const { governorshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_GOVERNORSHIP, {
    variables: { id: governorshipId },
  })
  const [RecordService] = useMutation(RECORD_SERVICE)
  const [RecordServiceNoIncome] = useMutation(RECORD_SERVICE_NO_INCOME)

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      {currentUser.noIncomeTracking ? (
        <ServiceFormNoIncome
          RecordServiceMutation={RecordServiceNoIncome}
          church={data?.governorships[0]}
          churchId={governorshipId}
          churchType="Governorship"
        />
      ) : (
        <ServiceForm
          RecordServiceMutation={RecordService}
          church={data?.governorships[0]}
          churchId={governorshipId}
          churchType="Governorship"
        />
      )}
    </ApolloWrapper>
  )
}

export default GovernorshipService
