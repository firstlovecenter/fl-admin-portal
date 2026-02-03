import { ApolloQueryResult, useMutation } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { alertMsg } from 'global-utils'
import { useContext, useState } from 'react'
import { Button } from 'react-bootstrap'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  CONFIRM_OFFERING_PAYMENT,
  SELF_BANKING_RECEIPT,
} from 'pages/services/banking/self-banking/bankingQueries'
import { DotLoader } from 'react-spinners'

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
}

const ButtonConfirmPayment = (props: ButtonConfirmPaymentProps) => {
  const { refetch, service, handleClose, ...rest } = props
  const [sending, setSending] = useState(false)
  const router = useRouter()
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
  const pathname = usePathname()

  return (
    <Button
      variant="warning"
      className="mt-3"
      {...rest}
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
              router.push('/self-banking/receipt')
              alertMsg(
                'Your Payment is still pending please follow the manual steps for approval'
              )
              return
            }

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'failed'
            ) {
              router.push('/services/bacenta/self-banking')
              alertMsg('Your Payment Failed 😞. Please try again!')
              return
            }

            if (
              confirmationRes.data.ConfirmOfferingPayment?.transactionStatus ===
              'success'
            ) {
              router.push('/self-banking/receipt')
              alertMsg('Payment Confirmed Successfully 😊')
              return
            }
          }

          if (
            ['failed', 'abandoned'].includes(serviceRecord.transactionStatus)
          ) {
            router.push('/services/bacenta/self-banking')
            alertMsg('Your Payment Failed 😞. Please try again!')
            return
          }

          if (serviceRecord.transactionStatus === 'success') {
            alertMsg('Payment Confirmed Successfully 😊')
            router.push('/self-banking/receipt')
          }
        } catch (error: any) {
          router.push('/services/bacenta/self-banking')
          alert('Something went wrong 😞' + JSON.stringify(error))
        } finally {
          if (handleClose) {
            handleClose()
          }
          if (pathname === '/self-banking/confirm-payment') {
            router.push('/services/bacenta/self-banking')
          }
          setSending(false)
        }
      }}
    >
      {sending && <DotLoader size={23} />} Confirm Transaction
    </Button>
  )
}

export default ButtonConfirmPayment
