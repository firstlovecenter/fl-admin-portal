import { ApolloQueryResult, useMutation } from '@apollo/client'
import { Button } from 'components/ui/button'
import { ChurchContext } from 'contexts/ChurchContext'
import { alertMsg, throwToSentry } from 'global-utils'
import { Loader2 } from 'lucide-react'
import { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  CONFIRM_OFFERING_PAYMENT,
  SELF_BANKING_RECEIPT,
} from '../../bankingQueries'

export type ConfirmPaymentServiceType = {
  id: string
  transactionStatus?: 'success' | 'pending' | 'failed' | 'abandoned'
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
          hubId?: string
          hubCouncilId?: string
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
  const [sending, setSending] = useState(false)
  const navigate = useNavigate()
  const {
    bacentaId,
    governorshipId,
    councilId,
    hubId,
    hubCouncilId,
    ministryId,
    clickCard,
  } = useContext(ChurchContext)
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
            hubId,
            hubCouncilId,
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
          } else if (res.data?.hubs) {
            serviceRecord = res.data?.hubs[0].rehearsals.find(
              (serviceFromList: ConfirmPaymentServiceType) =>
                serviceFromList?.id === service?.id
            )
          } else if (res.data?.hubCouncils) {
            serviceRecord = res.data?.hubCouncils[0].rehearsals.find(
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
              alertMsg(
                'Your Payment is still pending please follow the manual steps for approval'
              )
              return
            }

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'failed'
            ) {
              navigate('/services/bacenta/self-banking')
              alertMsg('Your Payment Failed 😞. Please try again!')
              return
            }

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'success'
            ) {
              navigate('/self-banking/receipt')
              alertMsg('Payment Confirmed Successfully 😊')
              return
            }
          }

          if (
            ['failed', 'abandoned'].includes(serviceRecord.transactionStatus)
          ) {
            navigate('/services/bacenta/self-banking')
            alertMsg('Your Payment Failed 😞. Please try again!')
            return
          }

          if (serviceRecord.transactionStatus === 'success') {
            alertMsg('Payment Confirmed Successfully 😊')
            navigate('/self-banking/receipt')
            return
          }
        } catch (error: any) {
          navigate('/services/bacenta/self-banking')
          alertMsg(error?.message ?? 'Something went wrong 😞')
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
      {sending ? 'Confirming…' : 'Confirm Transaction'}
    </Button>
  )
}

export default ButtonConfirmPayment
