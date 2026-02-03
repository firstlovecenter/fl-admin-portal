import React, { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useMutation, useQuery } from '@apollo/client'
import {
  RECORD_SERVICE,
  RECORD_SERVICE_NO_INCOME,
} from './RecordServiceMutations'
import { DISPLAY_BACENTA } from 'pages/directory/display/ReadQueries'
import ServiceForm from './ServiceForm'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { BACENTA_GRAPHS } from '../graphs/GraphsQueries'
import ServiceFormNoIncome from './ServiceFormNoIncome'

const BacentaService = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_BACENTA, {
    variables: { id: bacentaId },
  })
  const [RecordService] = useMutation(RECORD_SERVICE, {
    refetchQueries: [{ query: BACENTA_GRAPHS, variables: { id: bacentaId } }],
  })
  const [RecordServiceNoIncome] = useMutation(RECORD_SERVICE_NO_INCOME, {
    refetchQueries: [{ query: BACENTA_GRAPHS, variables: { id: bacentaId } }],
  })

  const bacenta = data?.bacentas[0]
  const shouldNotRecordIncome =
    bacenta?.noIncomeTracking || bacenta?.vacationStatus === 'Online'

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      {shouldNotRecordIncome ? (
        <ServiceFormNoIncome
          RecordServiceMutation={RecordServiceNoIncome}
          church={data?.bacentas[0]}
          churchId={bacentaId}
          churchType="Bacenta"
        />
      ) : (
        <ServiceForm
          RecordServiceMutation={RecordService}
          church={data?.bacentas[0]}
          churchId={bacentaId}
          churchType="Bacenta"
        />
      )}
    </ApolloWrapper>
  )
}

export default BacentaService
