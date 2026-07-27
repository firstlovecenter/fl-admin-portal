import { ApolloQueryResult, useMutation } from '@apollo/client'
import { Button } from 'components/ui/button'
import { ChurchContext } from 'contexts/ChurchContext'
import { alertMsg, alertSuccess, throwToSentry } from 'global-utils'
import { Loader2 } from 'lucide-react'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import {
  CONFIRM_OFFERING_PAYMENT,
  SELF_BANKING_RECEIPT,
} from '../../bankingQueries'

export type ConfirmPaymentServiceType = {
  id: string
  transactionStatus?:
    | 'pending'
    | 'send OTP'
    | 'success'
    | 'failed'
    | 'abandoned'
    | 'reversed'
} | null

type ButtonConfirmPaymentProps = {
  refetch: (
    variables?:
      | Partial<{
          id?: string
          serviceRecordId?: string
          bacentaId?: string
          governorshipId?: string
          councilId?: string
          ministryId?: string
        }>
      | undefined
  ) => Promise<ApolloQueryResult<any>>
  service: ConfirmPaymentServiceType
  disabled?: boolean
  handleClose?: () => void
  className?: string
}

const ButtonConfirmPayment = (props: ButtonConfirmPaymentProps) => {
  const { refetch, service, handleClose, disabled, className } = props
  const { t } = useTranslation()
  const [sending, setSending] = useState(false)
  const navigate = useNavigate()
  const { bacentaId, governorshipId, councilId, ministryId, clickCard } =
    useContext(ChurchContext)
  const [ConfirmOfferingPayment] = useMutation(CONFIRM_OFFERING_PAYMENT)
  const location = useLocation()

  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled || sending}
      className={className ?? 'w-full gap-2'}
      onClick={async () => {
        setSending(true)

        try {
          const res = await refetch({
            bacentaId,
            governorshipId,
            councilId,
            ministryId,
          })

          clickCard({
            id: service?.id,
            __typename: 'ServiceRecord',
          })

          let serviceRecord: { id: string; transactionStatus: string } = {
            id: '',
            transactionStatus: '',
          }

          if (res.data?.bacentas) {
            serviceRecord = res.data?.bacentas[0].services.find(
              (serviceFromList: ConfirmPaymentServiceType) =>
                serviceFromList?.id === service?.id
            )
          } else if (res.data?.governorships) {
            serviceRecord = res.data?.governorships[0].services.find(
              (serviceFromList: ConfirmPaymentServiceType) =>
                serviceFromList?.id === service?.id
            )
          } else if (res.data?.councils) {
            serviceRecord = res.data?.councils[0].services.find(
              (serviceFromList: ConfirmPaymentServiceType) =>
                serviceFromList?.id === service?.id
            )
          } else if (res.data?.ministries) {
            serviceRecord = res.data?.ministries[0].services.find(
              (serviceFromList: ConfirmPaymentServiceType) =>
                serviceFromList?.id === service?.id
            )
          }

          if (res.data?.serviceRecords) {
            serviceRecord = res.data?.serviceRecords[0]
          }

          if (serviceRecord.transactionStatus === 'pending') {
            const confirmationRes = await ConfirmOfferingPayment({
              variables: {
                serviceRecordId: service?.id,
              },
              refetchQueries: [
                {
                  query: SELF_BANKING_RECEIPT,
                  variables: { id: service?.id },
                },
              ],
            })

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'pending'
            ) {
              navigate('/self-banking/receipt')
              alertMsg(t('services.banking.confirmPayment.alertStillPending'))
              return
            }

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'failed'
            ) {
              navigate('/services/bacenta/self-banking')
              alertMsg(t('services.banking.confirmPayment.alertFailed'))
              return
            }

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'success'
            ) {
              navigate('/self-banking/receipt')
              alertSuccess(t('services.banking.confirmPayment.alertSuccess'))
              return
            }

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'reversed'
            ) {
              navigate('/services/bacenta/self-banking')
              alertMsg(t('services.banking.confirmPayment.alertReversed'))
              return
            }
          }

          if (serviceRecord.transactionStatus === 'reversed') {
            navigate('/services/bacenta/self-banking')
            alertMsg(t('services.banking.confirmPayment.alertReversed'))
            return
          }

          if (
            ['failed', 'abandoned'].includes(serviceRecord.transactionStatus)
          ) {
            navigate('/services/bacenta/self-banking')
            alertMsg(t('services.banking.confirmPayment.alertFailed'))
            return
          }

          if (serviceRecord.transactionStatus === 'success') {
            alertSuccess(t('services.banking.confirmPayment.alertSuccess'))
            navigate('/self-banking/receipt')
            return
          }
        } catch (error: any) {
          navigate('/services/bacenta/self-banking')
          alertMsg(
            error?.message ?? t('services.banking.confirmPayment.alertGeneric')
          )
          throwToSentry('Error confirming offering payment', error)
        } finally {
          if (handleClose) {
            handleClose()
          }
          if (location.pathname === '/self-banking/confirm-payment') {
            navigate(-3)
          }
          setSending(false)
        }
      }}
    >
      {sending && <Loader2 className="size-4 animate-spin" />}
      {sending
        ? t('services.banking.common.confirming')
        : t('services.banking.confirmPayment.confirmTransaction')}
    </Button>
  )
}

export default ButtonConfirmPayment
