import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useState } from 'react'
import { GOVERNORSHIP_BANKING_SLIP_QUERIES } from 'pages/services/ServicesQueries'
import { ConfirmPaymentServiceType } from './components/button/ConfirmPayment'
import SelfBankingList from './components/SelfBankingList'
import useModal from 'hooks/useModal'

const GovernorshipSelfBanking = () => {
  const { governorshipId } = useContext(ChurchContext)
  const { show, handleShow, handleClose } = useModal()
  const [skip, setSkip] = useState<number>(0)
  const [confirmService, setConfirmService] =
    useState<ConfirmPaymentServiceType>(null)
  const { data, loading, error, refetch } = useQuery(
    GOVERNORSHIP_BANKING_SLIP_QUERIES,
    {
      variables: { governorshipId },
      onCompleted: (data) => {
        const governorship = data?.governorships[0]
        const service = governorship?.services.find(
          (service: any) => service.transactionStatus === 'pending'
        )

        setConfirmService({
          id: service?.id,
        })

        if (service?.transactionStatus === 'pending') {
          handleShow()
        }
      },
    }
  )
  const governorship = data?.governorships[0]

  return (
    <SelfBankingList
      church={governorship}
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

export default GovernorshipSelfBanking
