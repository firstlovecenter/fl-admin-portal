import { useQuery } from '@apollo/client'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import { ServiceContext } from 'contexts/ServiceContext'
import { Loader2, Phone } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SELF_BANKING_RECEIPT } from './bankingQueries'
import ManualApprovalSteps from './ManualApprovalSteps'
import ButtonConfirmPayment from './components/button/ConfirmPayment'

const ConfirmPayment = () => {
  const { t } = useTranslation()
  const { serviceRecordId } = useContext(ServiceContext)
  const { data, loading, error, refetch } = useQuery(SELF_BANKING_RECEIPT, {
    variables: { id: serviceRecordId },
  })
  const [countdown, setCountdown] = useState(15)
  const [manualOpen, setManualOpen] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [countdown])

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center gap-6 px-4 py-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:px-6">
        {/* Hero status card */}
        <Card>
          <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
            {loading && !data ? (
              <Skeleton className="size-20 rounded-full" />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-brand/10">
                <Loader2 className="size-10 animate-spin text-brand" />
              </span>
            )}
            <div className="space-y-2">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {t('services.banking.confirmPayment.processing')}
              </p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {t('services.banking.confirmPayment.processingBody')}
              </p>
              {error && (
                <p className="text-xs text-destructive">{error.message}</p>
              )}
            </div>

            <div className="w-full max-w-xs space-y-2">
              <ButtonConfirmPayment
                refetch={refetch}
                disabled={countdown > 0}
                service={{ id: serviceRecordId }}
              />
              {countdown > 0 ? (
                <p className="text-sm text-muted-foreground tabular-nums">
                  {t('services.banking.confirmPayment.confirmIn', {
                    count: countdown,
                  })}
                </p>
              ) : (
                <button
                  type="button"
                  className="mx-auto block min-h-11 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => setManualOpen(true)}
                >
                  {t('services.banking.confirmPayment.promptNotReceived')}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar — guidance */}
        <aside className="lg:sticky lg:top-6">
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-banking/10">
                  <Phone className="size-5 text-banking" />
                </span>
                <h2 className="text-sm font-semibold text-foreground">
                  {t('services.banking.confirmPayment.whatToExpect')}
                </h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t('services.banking.confirmPayment.expect1')}</li>
                <li>{t('services.banking.confirmPayment.expect2')}</li>
                <li>{t('services.banking.confirmPayment.expect3')}</li>
                <li>{t('services.banking.confirmPayment.expect4')}</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {t('services.banking.confirmPayment.manualApprovalTitle')}
            </DialogTitle>
          </DialogHeader>
          <ManualApprovalSteps close={() => setManualOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfirmPayment
