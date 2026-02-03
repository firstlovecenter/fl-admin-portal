import { useContext } from 'react'
import { ChurchContext } from '@/contexts/ChurchContext'

import { useQuery } from '@apollo/client'
import { DISPLAY_HUB } from 'pages/directory/display/ReadQueries'
import CancelledServiceForm from '../CancelledServiceForm'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const HubServiceCancelled = () => {
  const { hubId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_HUB, {
    variables: { id: hubId },
  })

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <CancelledServiceForm
        church={data?.hubs[0]}
        churchId={hubId}
        churchType="hub"
      />
    </ApolloWrapper>
  )
}

export default HubServiceCancelled
