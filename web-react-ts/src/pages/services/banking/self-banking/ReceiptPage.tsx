import { useMutation, useQuery } from '@apollo/client'
import RoleView from 'auth/RoleView'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { ServiceContext } from 'contexts/ServiceContext'
import { Form, Formik } from 'formik'
import { capitalise, throwToSentry } from 'global-utils'
import {
  getHumanReadableDate,
  parseDate,
  parseNeoTime,
} from 'lib/date-utils'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  XCircle,
} from 'lucide-react'
import { permitAdmin } from 'permission-utils'
import { ReactNode, useContext } from 'react'
import { useNavigate } from 'react-router'
import {
  CONFIRM_OFFERING_PAYMENT,
  SELF_BANKING_RECEIPT,
  SET_TRANSACTION_REFERENCE_MANUALLY,
} from './bankingQueries'
import ButtonConfirmPayment from './components/button/ConfirmPayment'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { TRANSACTION_STATUS } from '../banking-constants'

type StatusVariant = 'success' | 'pending' | 'failed' | 'unknown'

const variantFor = (status: string | undefined): StatusVariant => {
  if (status === TRANSACTION_STATUS.SUCCESS) return 'success'
  if (
    status === TRANSACTION_STATUS.PENDING ||
    status === TRANSACTION_STATUS.SEND_OTP
  ) {
    return 'pending'
  }
  if (
    status === TRANSACTION_STATUS.FAILED ||
    status === TRANSACTION_STATUS.ABANDONED
  ) {
    return 'failed'
  }
  return 'unknown'
}

const variantStyles: Record<
  StatusVariant,
  { bg: string; text: string; ring: string; icon: ReactNode; title: string }
> = {
  success: {
    bg: 'bg-banking/10',
    text: 'text-banking',
    ring: 'ring-banking/30',
    icon: <CheckCircle2 className="size-7" />,
    title: 'Payment Successful',
  },
  pending: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    ring: 'ring-warning/30',
    icon: <Clock className="size-7" />,
    title: 'Payment Pending',
  },
  failed: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    ring: 'ring-destructive/30',
    icon: <XCircle className="size-7" />,
    title: 'Payment Failed',
  },
  unknown: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    ring: 'ring-border',
    icon: <AlertCircle className="size-7" />,
    title: 'Payment Status',
  },
}

const Row = ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3">
    <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
    <span className="min-w-0 break-words text-right text-sm font-medium text-foreground">
      {children}
    </span>
  </div>
)

const ReceiptPage = () => {
  const { serviceRecordId } = useContext(ServiceContext)

  const { data, loading, error, refetch } = useQuery(SELF_BANKING_RECEIPT, {
    variables: { id: serviceRecordId },
  })
  const [SetTransactionReferenceManually] = useMutation(
    SET_TRANSACTION_REFERENCE_MANUALLY
  )
  const [ConfirmOfferingPayment] = useMutation(CONFIRM_OFFERING_PAYMENT)

  const navigate = useNavigate()
  const service = data?.serviceRecords[0]
  const variant = variantFor(service?.transactionStatus)
  const styles = variantStyles[variant]

  const submitTransactionReference = async (values: any) => {
    const { transactionReference } = values
    try {
      await SetTransactionReferenceManually({
        variables: {
          serviceRecordId,
          transactionReference,
        },
      })
      await ConfirmOfferingPayment({
        variables: { serviceRecordId },
        refetchQueries: [
          {
            query: SELF_BANKING_RECEIPT,
            variables: { id: serviceRecordId },
          },
        ],
      })
      refetch()
    } catch (err) {
      throwToSentry('', err)
    }
  }

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Self-Banking <span className="text-banking">Receipt</span>
        </h1>
      </StickyPageHeader>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        {error && (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">
              {error.message}
            </CardContent>
          </Card>
        )}

        {(loading || !service) && !error && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        )}

        {service && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
            {/* LEFT — status + details */}
            <div className="space-y-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <span
                    className={`flex size-14 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${styles.bg} ${styles.text} ${styles.ring}`}
                  >
                    {styles.icon}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      {styles.title}
                    </h2>
                    {service.offeringBankedBy?.fullName && (
                      <p className="truncate text-sm text-muted-foreground">
                        Banked by {service.offeringBankedBy.fullName}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={`${styles.text}`}>
                    {capitalise(service.transactionStatus)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <Receipt className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transaction details
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    <Row label="Date of Service">
                      {getHumanReadableDate(service.serviceDate?.date)}
                    </Row>
                    <Row label="Cash">
                      <span className="font-mono tabular-nums">
                        {service.cash}
                      </span>
                    </Row>
                    {service.offeringBankedBy?.fullName && (
                      <Row label="Offering Banked By">
                        {service.offeringBankedBy.fullName}
                      </Row>
                    )}
                    {service.transactionReference && (
                      <Row label="Transaction Ref">
                        <span className="font-mono text-xs">
                          {service.transactionReference}
                        </span>
                      </Row>
                    )}
                    <Row label="Transaction Status">
                      <span className={styles.text}>
                        {capitalise(service.transactionStatus)}
                      </span>
                    </Row>
                    {service.sourceNetwork && (
                      <Row label="Network Used">{service.sourceNetwork}</Row>
                    )}
                    {service.sourceNumber && (
                      <Row label="Number Used">
                        <span className="font-mono tabular-nums">
                          {service.sourceNumber}
                        </span>
                      </Row>
                    )}
                    {service.desc && <Row label="Reference">{service.desc}</Row>}
                    {service.transactionTime && (
                      <>
                        <Row label="Date of Banking">
                          {parseDate(service.transactionTime)}
                        </Row>
                        <Row label="Time of Banking">
                          {parseNeoTime(service.transactionTime)}
                        </Row>
                      </>
                    )}
                    {service.transactionError && (
                      <Row label="Transaction Error">
                        <span className="text-destructive">
                          {service.transactionError}
                        </span>
                      </Row>
                    )}
                  </div>
                </CardContent>
              </Card>

              <RoleView roles={permitAdmin('Stream')}>
                {service.transactionStatus !== TRANSACTION_STATUS.SUCCESS &&
                  service.transactionStatus !== TRANSACTION_STATUS.PENDING && (
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">
                          Set Transaction Reference
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Stream admins can manually set a reference to retry
                          confirmation.
                        </p>
                      </div>
                      <Formik
                        initialValues={{ transactionReference: '' }}
                        onSubmit={submitTransactionReference}
                      >
                        {(formik) => (
                          <Form className="space-y-3">
                            <Input
                              name="transactionReference"
                              label="Transaction Reference"
                            />
                            <SubmitButton formik={formik} />
                          </Form>
                        )}
                      </Formik>
                    </CardContent>
                  </Card>
                )}
              </RoleView>
            </div>

            {/* RIGHT — next-step actions */}
            <aside className="space-y-3 lg:sticky lg:top-6">
              <Card>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Next steps
                  </h3>
                  {service.transactionStatus === TRANSACTION_STATUS.PENDING && (
                    <ButtonConfirmPayment
                      refetch={refetch}
                      service={{ id: serviceRecordId }}
                    />
                  )}
                  <Button
                    type="button"
                    size="lg"
                    variant={
                      service.transactionStatus === TRANSACTION_STATUS.PENDING
                        ? 'outline'
                        : 'default'
                    }
                    className="w-full"
                    onClick={() => navigate('/services')}
                  >
                    Go Home
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

export default ReceiptPage
