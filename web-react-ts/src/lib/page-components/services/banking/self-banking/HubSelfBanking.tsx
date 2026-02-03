import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useState } from 'react'
import { HUB_BANKING_SLIP_QUERIES } from 'pages/services/ServicesQueries'
import { ConfirmPaymentServiceType } from './components/button/ConfirmPayment'
import useModal from 'hooks/useModal'
import SelfBankingList from './components/RehearsalsSelfBankingList'

const HubSelfBanking = () => {
  const { hubId } = useContext(ChurchContext)
  const { show, handleShow, handleClose } = useModal()
  const [skip, setSkip] = useState<number>(0)
  const [confirmService, setConfirmService] =
    useState<ConfirmPaymentServiceType>(null)

  const { data, loading, error, refetch } = useQuery(HUB_BANKING_SLIP_QUERIES, {
    variables: { hubId, skip },
    onCompleted: (data) => {
      const hub = data?.hubs[0]
      const service = hub?.rehearsals.find(
        (service: any) => service.transactionStatus === 'pending'
      )

      setConfirmService({
        id: service?.id,
      })

      if (service?.transactionStatus === 'pending') {
        handleShow()
      }
    },
  })
  const hub = data?.hubs[0]

  return (
    <SelfBankingList
      church={hub}
      loading={loading}
      error={error}
      refetch={refetch}
      confirmationTools={{
        confirmService,
        setConfirmService,
      }}
      popupTools={{ show, handleClose, handleShow }}
      skip={skip}
      setSkip={setSkip}
    />
  )
}

export default HubSelfBanking
