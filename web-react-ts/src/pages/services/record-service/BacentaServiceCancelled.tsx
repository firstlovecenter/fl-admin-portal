import { useContext } from 'react'
import { ChurchContext } from '../../../contexts/ChurchContext'

import { useQuery } from '@apollo/client'
import { DISPLAY_BACENTA } from '../../directory/display/ReadQueries'
import CancelledServiceForm from './CancelledServiceForm'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const BacentaServiceCancelled = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_BACENTA, {
    variables: { id: bacentaId },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <CancelledServiceForm
        church={data?.bacentas[0]}
        churchId={bacentaId}
        churchType="bacenta"
      />
    </ApolloWrapper>
  )
}

export default BacentaServiceCancelled
