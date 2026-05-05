import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  BarChart3,
  CheckCircle2,
  Clock,
  Plus,
  ReceiptText,
  Wallet,
} from 'lucide-react'
import { getTodayTime, isToday } from 'jd-date-utils'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { ChurchContext } from 'contexts/ChurchContext'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import useModal from 'hooks/useModal'
import { cn } from 'components/lib/utils'
import { BACENTA_ARRIVALS } from './arrivalsQueries'
import {
  beforeArrivalDeadline,
  beforeMobilisationDeadline,
} from './arrivals-utils'
import { BacentaWithArrivals, VehicleRecord } from './arrivals-types'
import CountdownTimer from './countdown-component/CountdownTimer'
import ButtonIcons from './components/ButtonIcons'

const VehicleRow = ({
  record,
  disabled,
}: {
  record: VehicleRecord
  disabled: boolean
}) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const arrived = !!record?.arrivalTime

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        clickCard(record)
        navigate('/bacenta/vehicle-details')
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
        'min-h-14 disabled:cursor-not-allowed disabled:opacity-60',
        arrived
          ? 'border-success/30 bg-success/10 hover:bg-success/15'
          : 'border-warning/40 bg-warning/10 hover:bg-warning/15'
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          arrived ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
        )}
      >
        <ButtonIcons type={record?.vehicle} />
      </span>
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {record?.vehicle}{' '}
        <span className="text-muted-foreground">
          ({record?.attendance ?? 0})
        </span>
      </span>
      {arrived && <CheckCircle2 className="size-5 shrink-0 text-success" />}
    </button>
  )
}

const SectionLabel = ({ children }: { children: string }) => (
  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    {children}
  </h2>
)

const BacentaArrivals = () => {
  const { clickCard, bacentaId } = useContext(ChurchContext)
  const { show, handleClose } = useModal()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error, refetch } = useQuery(BACENTA_ARRIVALS, {
    variables: { id: bacentaId, date: today },
  })

  const bacenta: BacentaWithArrivals = data?.bacentas[0]
  const date = data?.timeGraphs[0]

  const isMomoCleared = (b?: BacentaWithArrivals) => {
    if (!b) return true
    if (b.sprinterTopUp || b.urvanTopUp) {
      return !!b.momoNumber
    }
    return true
  }

  const bussing = bacenta?.bussing.find((rec) =>
    isToday(rec.serviceDate.date.toString())
  )

  const isBeforeArrivalEnd = bussing
    ? beforeArrivalDeadline(bussing, bacenta)
    : false

  const canFillOnTheWay =
    !!bussing &&
    isBeforeArrivalEnd &&
    !!bussing.mobilisationPicture &&
    !bussing.leaderDeclaration

  const mobilisationDisabled =
    !beforeMobilisationDeadline(bacenta, bussing) || !isMomoCleared(bacenta)

  const showMobilisationError = mobilisationDisabled && !!bussing

  useEffect(() => handleClose(), [])

  const dateTimeToEnd = new Date(
    getTodayTime(bacenta?.stream?.arrivalEndTime)
  ).getTime()

  const filledFormsToday = !!bussing?.leaderDeclaration
  const tooLate =
    !isBeforeArrivalEnd && !!bussing?.mobilisationPicture && !filledFormsToday

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error}>
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {/* Page header */}
            <header className="mb-6 space-y-1 lg:mb-8">
              {loading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                  {bacenta?.name}{' '}
                  <span className="text-arrivals">Arrivals</span>
                </h1>
              )}
              {date?.swell && (
                <p className="inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-warning">
                  <AlertTriangle className="size-3.5" /> Swollen Weekend
                </p>
              )}
            </header>

            {/* Two-column grid on desktop */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
              {/* LEFT — status / countdown */}
              <section className="space-y-4">
                <SectionLabel>Today&apos;s Status</SectionLabel>

                <Card className="overflow-hidden">
                  <CardContent className="space-y-5 p-6 text-center">
                    {!filledFormsToday && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Code of the Day
                        </p>
                        <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-arrivals">
                          {bacenta?.arrivalsCodeOfTheDay ?? '—'}
                        </p>
                      </div>
                    )}

                    {isBeforeArrivalEnd && (
                      <div className="space-y-2 border-t border-border pt-5">
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Clock className="size-3.5" /> Arrivals close in
                        </div>
                        <div className="text-success">
                          <CountdownTimer targetDate={dateTimeToEnd} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {tooLate && (
                  <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="space-y-2 p-6 text-center">
                      <p className="text-4xl">😞</p>
                      <h2 className="text-lg font-semibold text-destructive">
                        It is too late to fill your forms!
                      </h2>
                      <p className="text-sm italic text-muted-foreground">
                        Ecclesiastes 3:1 — To every thing there is a season,
                        and a time to every purpose under the heaven.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {filledFormsToday && (
                  <Card className="border-success/40 bg-success/5">
                    <CardContent className="space-y-2 p-6 text-center">
                      <CheckCircle2 className="mx-auto size-8 text-success" />
                      <p className="text-sm font-medium text-foreground">
                        You have filled your forms today
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click{' '}
                        <span className="font-semibold text-success">
                          Today&apos;s Bussing Summary
                        </span>{' '}
                        below to view your bussing data
                      </p>
                      <ArrowDown className="mx-auto size-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-center gap-2"
                  onClick={() => navigate('/bacenta/graphs')}
                >
                  <BarChart3 className="size-4" />
                  View Last 4 Weeks
                </Button>
              </section>

              {/* RIGHT — actions */}
              <section className="space-y-4">
                <SectionLabel>Actions</SectionLabel>

                {!isMomoCleared(bacenta) && (
                  <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="space-y-3 p-5">
                      <Button
                        variant="destructive"
                        size="lg"
                        className="w-full gap-2"
                        onClick={() => navigate('/bacenta/editbussing')}
                      >
                        <Wallet className="size-4" />
                        Update payment details
                      </Button>
                      <p className="text-center text-xs font-medium text-destructive">
                        You will need this to fill your forms
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={mobilisationDisabled}
                    onClick={() => {
                      clickCard(bacenta)
                      clickCard(bussing)
                      navigate('/arrivals/submit-mobilisation-picture')
                    }}
                  >
                    Upload Pre-Mobilisation Picture
                  </Button>
                  {showMobilisationError && (
                    <p className="text-center text-xs font-medium text-destructive">
                      Pre-Mobilisation Form is not open!
                    </p>
                  )}
                </div>

                <Card>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <SectionLabel>Vehicles</SectionLabel>
                      <p className="text-xs font-semibold text-warning">
                        One form per vehicle
                      </p>
                    </div>

                    {bussing?.vehicleRecords?.length ? (
                      <div className="space-y-2">
                        {bussing.vehicleRecords.map((record, index) => (
                          <VehicleRow
                            key={record.id ?? index}
                            record={record}
                            disabled={!canFillOnTheWay}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                        No vehicles added yet
                      </p>
                    )}

                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full gap-2"
                      disabled={!canFillOnTheWay}
                      onClick={() => {
                        clickCard(bacenta)
                        clickCard(bussing)
                        navigate('/arrivals/submit-vehicle-record')
                      }}
                    >
                      <Plus className="size-4" />
                      Add a Vehicle
                    </Button>
                  </CardContent>
                </Card>

                {bussing && (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => {
                      clickCard(bacenta)
                      clickCard(bussing)
                      navigate('/bacenta/bussing-details')
                    }}
                  >
                    <ReceiptText className="size-4" />
                    Today&apos;s Bussing Summary
                  </Button>
                )}
              </section>
            </div>

            <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>You Are Too Late! 😞</DialogTitle>
                  <DialogDescription>
                    To everything there is a time and a season, and your time is
                    up.
                  </DialogDescription>
                </DialogHeader>
                <p className="text-center text-lg font-semibold">
                  It is too late to fill your forms.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentaArrivals
