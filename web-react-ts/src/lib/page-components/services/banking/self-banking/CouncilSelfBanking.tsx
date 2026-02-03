import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useState } from 'react'
import { COUNCIL_BANKING_SLIP_QUERIES } from 'pages/services/ServicesQueries'
import { ConfirmPaymentServiceType } from './components/button/ConfirmPayment'
import SelfBankingList from './components/SelfBankingList'
import useModal from 'hooks/useModal'

const CouncilSelfBanking = () => {
  const { councilId } = useContext(ChurchContext)
  const { show, handleShow, handleClose } = useModal()
  const [skip, setSkip] = useState<number>(0)
  const [confirmService, setConfirmService] =
    useState<ConfirmPaymentServiceType>(null)
  const { data, loading, error, refetch } = useQuery(
    COUNCIL_BANKING_SLIP_QUERIES,
    {
      variables: { councilId },
      onCompleted: (data) => {
        const council = data?.councils[0]
        const service = council?.services.find(
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
  const council = data?.councils[0]

  return (
    <SelfBankingList
      church={council}
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

export default CouncilSelfBanking
