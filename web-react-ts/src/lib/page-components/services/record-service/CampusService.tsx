import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useMutation, useQuery } from '@apollo/client'
import {
  RECORD_SERVICE,
  RECORD_SERVICE_NO_INCOME,
} from './RecordServiceMutations'
import { DISPLAY_CAMPUS } from 'pages/directory/display/ReadQueries'
import ServiceForm from './ServiceForm'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { MemberContext } from '@/contexts/MemberContext'
import ServiceFormNoIncome from './ServiceFormNoIncome'

const CampusService = () => {
  const { currentUser } = useContext(MemberContext)

  const { campusId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_CAMPUS, {
    variables: { id: campusId },
  })
  const [RecordService] = useMutation(RECORD_SERVICE)
  const [RecordServiceNoIncome] = useMutation(RECORD_SERVICE_NO_INCOME)

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      {currentUser.noIncomeTracking ? (
        <ServiceFormNoIncome
          RecordServiceMutation={RecordServiceNoIncome}
          church={data?.campuses[0]}
          churchId={campusId}
          churchType="Campus"
        />
      ) : (
        <ServiceForm
          RecordServiceMutation={RecordService}
          church={data?.campuses[0]}
          churchId={campusId}
          churchType="Campus"
        />
      )}
    </ApolloWrapper>
  )
}

export default CampusService
