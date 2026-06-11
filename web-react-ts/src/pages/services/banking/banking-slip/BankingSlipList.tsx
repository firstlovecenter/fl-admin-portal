import { ApolloError } from '@apollo/client'
import { Badge } from 'components/ui/badge'
import { Card, CardContent } from 'components/ui/card'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { ServiceRecord } from 'global-types'
import { throwToSentry } from 'global-utils'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { parseDate } from 'lib/date-utils'
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  FileText,
  Inbox,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useContext } from 'react'
import { useNavigate } from 'react-router'

type ChurchLike = {
  id?: string
  name?: string
  bankingCode?: string | null
  services?: ServiceRecord[]
}

type BankingSlipListProps = {
  church: ChurchLike | undefined
  loading: boolean
  error: ApolloError | undefined
  /** lowercase church-level segment used in detail navigation, e.g. 'bacenta' */
  levelSlug: 'bacenta' | 'council' | 'stream' | 'governorship'
}

const formatOffering = (amount: number | undefined, currency: string) => {
  if (amount == null) return '—'
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency || 'GHS',
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency || 'GHS'}`
  }
}

const BankingSlipList = ({
  church,
  loading,
  error,
  levelSlug,
}: BankingSlipListProps) => {
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  if (error) throwToSentry('', error)

  const currency = currentUser?.currency ?? 'GHS'

  const services: ServiceRecord[] = (church?.services ?? []).filter(
    (service) =>
      !service.noServiceReason && service.transactionStatus !== 'success'
  )

  const hasServices = services.length > 0
  const filledCount = services.filter((s) => Boolean(s.bankingSlip)).length
  const pendingCount = services.length - filledCount

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Banking Slips
        </p>
        {loading && !church ? (
          <Skeleton className="h-9 w-72" />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {church?.name} <span className="text-banking">Banking Slips</span>
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {church?.bankingCode && (
            <Badge
              variant="outline"
              className="border-banking/40 bg-banking/5 font-mono text-banking"
            >
              Banking Code · {church.bankingCode}
            </Badge>
          )}
          {!loading && hasServices && (
            <Badge variant="outline" className="text-muted-foreground">
              {filledCount}/{services.length} slip
              {services.length === 1 ? '' : 's'} filled
            </Badge>
          )}
        </div>
      </StickyPageHeader>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* LEFT — service list */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Services awaiting banking slip
              </h2>
              <p className="text-sm text-muted-foreground">
                Tap a service to upload its slip
              </p>
            </div>

            {loading && !church && (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!loading && !hasServices && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Inbox className="size-6 text-muted-foreground" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-medium text-foreground">
                      Nothing to bank yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      When you have a service to bank, it will show up here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasServices && (
              <div className="space-y-3">
                {services.map((service) => {
                  const isFilled = Boolean(service.bankingSlip)
                  return (
                    <button
                      key={service.id}
                      type="button"
                      className="group block w-full min-h-[44px] rounded-xl border border-border bg-card text-left shadow-sm transition-colors hover:border-banking/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:bg-muted"
                      onClick={() => {
                        clickCard(service)
                        navigate(`/${levelSlug}/service-details`)
                      }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-banking/10">
                          <Banknote className="size-5 text-banking" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {parseDate(service.serviceDate.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Offering ·{' '}
                            <span className="font-mono tabular-nums text-foreground">
                              {formatOffering(service.income, currency)}
                            </span>
                          </p>
                        </div>
                        {isFilled ? (
                          <Badge
                            variant="outline"
                            className="border-banking/40 bg-banking/10 text-banking"
                          >
                            <CheckCircle2 className="mr-1 size-3" />
                            Filled
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-destructive/40 bg-destructive/10 text-destructive"
                          >
                            <XCircle className="mr-1 size-3" />
                            Not Filled
                          </Badge>
                        )}
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* RIGHT — explainer + status summary */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-banking/10">
                    <FileText className="size-5 text-banking" />
                  </span>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-foreground">
                      About banking slips
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Confirm what was banked
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground">
                  Upload a photo of the bank deposit slip for each service so
                  the offering can be reconciled with what was banked.
                </p>
                <ol className="space-y-3 text-sm">
                  {[
                    'Pick a service from the list.',
                    'Snap a clear photo of the deposit slip.',
                    'Submit — the slip is attached to the record.',
                  ].map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {!loading && hasServices && (
              <Card>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-banking/10">
                      <ShieldCheck className="size-5 text-banking" />
                    </span>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-foreground">
                        Slip status
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Across visible services
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <dt className="text-xs text-muted-foreground">Filled</dt>
                      <dd className="text-lg font-semibold tabular-nums text-banking">
                        {filledCount}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <dt className="text-xs text-muted-foreground">
                        Outstanding
                      </dt>
                      <dd className="text-lg font-semibold tabular-nums text-foreground">
                        {pendingCount}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

export default BankingSlipList
