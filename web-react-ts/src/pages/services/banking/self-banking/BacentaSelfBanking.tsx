import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useState } from 'react'
import { BACENTA_BANKING_SLIP_QUERIES } from '../../ServicesQueries'
import { ConfirmPaymentServiceType } from './components/button/ConfirmPayment'
import SelfBankingList from './components/SelfBankingList'
import useModal from 'hooks/useModal'

const BacentaSelfBanking = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { show, handleShow, handleClose } = useModal()
  const [skip, setSkip] = useState<number>(0)
  const [confirmService, setConfirmService] =
    useState<ConfirmPaymentServiceType>(null)

  const { data, loading, error, refetch } = useQuery(
    BACENTA_BANKING_SLIP_QUERIES,
    {
      variables: { bacentaId: bacentaId, skip },
      onCompleted: (data) => {
        const bacenta = data?.bacentas[0]
        const service = bacenta?.services.find(
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
  const bacenta = data?.bacentas[0]

  return (
    <SelfBankingList
      church={bacenta}
      loading={loading}
      error={error}
      refetch={refetch}
      confirmationTools={{
        confirmService: confirmService,
        setConfirmService: setConfirmService,
      }}
      popupTools={{ show, handleClose, handleShow }}
      skip={skip}
      setSkip={setSkip}
    />
  )
}

export default BacentaSelfBanking
