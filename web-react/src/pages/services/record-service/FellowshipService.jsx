import React, { useContext } from 'react'
import { ChurchContext } from '../../../contexts/ChurchContext'

import { useMutation, useQuery } from '@apollo/client'
import { RECORD_SERVICE } from './RecordServiceMutations'
import { DISPLAY_FELLOWSHIP } from '../../directory/display/ReadQueries'
import ServiceForm from './ServiceForm'
import BaseComponent from 'components/base-component/BaseComponent'
import { FELLOWSHIP_TRENDS } from '../trends/TrendsQueries'

const FellowshipService = () => {
  const { fellowshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_FELLOWSHIP, {
    variables: { id: fellowshipId },
  })
  const [RecordService] = useMutation(RECORD_SERVICE, {
    refetchQueries: [{ query: FELLOWSHIP_TRENDS }],
  })

  return (
    <BaseComponent loading={loading} error={error} data={data}>
      <ServiceForm
        RecordServiceMutation={RecordService}
        church={data?.fellowships[0]}
        churchId={fellowshipId}
        churchType="fellowship"
      />
    </BaseComponent>
  )
}

export default FellowshipService
