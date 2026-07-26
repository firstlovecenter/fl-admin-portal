import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  Camera,
  CheckCircle2,
  Clock,
  Maximize2,
  Plus,
  ReceiptText,
  Wallet,
} from 'lucide-react'
import { getTodayTime } from 'lib/date-utils'
import PullToRefresh from 'components/base-component/PullToRefresh'
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
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { cn } from 'components/lib/utils'
import UpdateBusPaymentDialog from 'pages/directory/update/UpdateBusPaymentDialog'
import { BACENTA_ARRIVALS } from './arrivalsQueries'
import {
  beforeArrivalDeadline,
  beforeMobilisationDeadline,
  canAddVehicleRecord,
} from './arrivals-utils'
import { BacentaWithArrivals, VehicleRecord } from './arrivals-types'
import CountdownTimer from './countdown-component/CountdownTimer'
import ButtonIcons from './components/ButtonIcons'
import { useTranslation } from 'react-i18next'

const VehicleRow = ({ record }: { record: VehicleRecord }) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const arrived = !!record?.arrivalTime

  return (
    <button
      type="button"
      onClick={() => {
        clickCard(record)
        navigate('/bacenta/vehicle-details')
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
        'min-h-14',
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
  const { t } = useTranslation()
  const { show, handleClose } = useModal()
  const [showCodeFullscreen, setShowCodeFullscreen] = useState(false)
  const [showMobPic, setShowMobPic] = useState(false)
  const [editBussingOpen, setEditBussingOpen] = useState(false)
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error, refetch } = useQuery(BACENTA_ARRIVALS, {
    variables: { id: bacentaId, date: today, bussingDate: today },
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

  const bussing = bacenta?.bussingThisWeek

  const isBeforeArrivalEnd = beforeArrivalDeadline(bacenta)
  const canAddVehicle = canAddVehicleRecord(bacenta, bussing)

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
          {/* Page header */}
          <StickyPageHeader>
            {loading || !bacenta ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {bacenta.name}{' '}
                <span className="text-arrivals">{t('arrivals.common.title')}</span>
              </h1>
            )}
            {date?.swell && (
              <p className="inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-warning">
                <AlertTriangle className="size-3.5" /> {t('arrivals.bacenta.swollenWeekend')}
              </p>
            )}
          </StickyPageHeader>
          <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
            {/* Two-column grid on desktop */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
              {/* LEFT — status / countdown */}
              <section className="space-y-4">
                <SectionLabel>{t('arrivals.bacenta.todayStatus')}</SectionLabel>

                <Card className="overflow-hidden">
                  {/* Code of the Day */}
                  {!filledFormsToday && (
                    <CardContent className="p-6 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('arrivals.bacenta.codeOfDay')}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <p className="font-mono text-3xl font-bold tabular-nums text-foreground dark:text-yellow-300">
                          {bacenta?.arrivalsCodeOfTheDay ?? '—'}
                        </p>
                        {bacenta?.arrivalsCodeOfTheDay && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-11 shrink-0 text-muted-foreground hover:text-foreground"
                            aria-label={t('arrivals.bacenta.showCodeFullscreen')}
                            onClick={() => setShowCodeFullscreen(true)}
                          >
                            <Maximize2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}

                  {/* Countdown — flush to card edges */}
                  {isBeforeArrivalEnd && (
                    <div className={cn('border-border', !filledFormsToday && 'border-t')}>
                      <p className="flex items-center justify-center gap-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Clock className="size-3.5" /> {t('arrivals.bacenta.arrivalsCloseIn')}
                      </p>
                      <CountdownTimer targetDate={dateTimeToEnd} />
                    </div>
                  )}
                </Card>

                {tooLate && (
                  <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="space-y-2 p-6 text-center">
                      <p className="text-4xl">😞</p>
                      <h2 className="text-lg font-semibold text-destructive">
                        {t('arrivals.bacenta.tooLateToFill')}
                      </h2>
                      <p className="text-sm italic text-muted-foreground">
                        {t('arrivals.bacenta.ecclesiastes')}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {filledFormsToday && (
                  <Card className="border-success/40 bg-success/5">
                    <CardContent className="space-y-2 p-6 text-center">
                      <CheckCircle2 className="mx-auto size-8 text-success" />
                      <p className="text-sm font-medium text-foreground">
                        {t('arrivals.bacenta.formsFilledToday')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('arrivals.bacenta.tap')}{' '}
                        <span className="font-semibold text-success">
                          {t('arrivals.bacenta.todayBussingSummary')}
                        </span>{' '}
                        {t('arrivals.bacenta.belowToView')}
                      </p>
                      <ArrowDown
                        className="mx-auto size-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </CardContent>
                  </Card>
                )}

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
                    {t('arrivals.bacenta.todayBussingSummary')}
                  </Button>
                )}
              </section>

              {/* RIGHT — actions */}
              <section className="space-y-4">
                <SectionLabel>{t('arrivals.common.actions')}</SectionLabel>

                {!isMomoCleared(bacenta) && (
                  <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="space-y-3 p-5">
                      <Button
                        variant="destructive"
                        size="lg"
                        className="w-full gap-2"
                        onClick={() => setEditBussingOpen(true)}
                      >
                        <Wallet className="size-4" />
                        {t('arrivals.bacenta.updatePaymentDetails')}
                      </Button>
                      <p className="text-center text-xs font-medium text-destructive">
                        {t('arrivals.bacenta.paymentDetailsRequired')}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {bussing?.mobilisationPicture ? (
                  /* Already submitted — show thumbnail, click opens lightbox */
                  <button
                    type="button"
                    className="group relative w-full overflow-hidden rounded-xl border border-success/40 bg-success/5 transition-colors hover:bg-success/10 active:bg-success/15"
                    onClick={() => setShowMobPic(true)}
                    aria-label={t('arrivals.bacenta.viewMobilisationPicture')}
                  >
                    <img
                      src={bussing.mobilisationPicture}
                      alt={t('arrivals.common.mobilisation')}
                      className="h-36 w-full object-cover"
                    />
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="flex items-center gap-2 text-xs font-semibold text-success">
                        <CheckCircle2 className="size-4" />
                        {t('arrivals.bacenta.mobilisationPictureUploaded')}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-success">
                        <Camera className="size-3.5" />
                        {t('arrivals.common.view')}
                      </span>
                    </div>
                  </button>
                ) : (
                  /* Not yet submitted */
                  <div className="space-y-2">
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={mobilisationDisabled}
                      onClick={() => {
                        clickCard(bacenta)
                        navigate('/arrivals/submit-mobilisation-picture')
                      }}
                    >
                      {t('arrivals.bacenta.uploadPreMobilisationPicture')}
                    </Button>
                    {showMobilisationError && (
                      <p className="text-center text-xs font-medium text-destructive">
                        {t('arrivals.bacenta.preMobilisationWindowClosed')}
                      </p>
                    )}
                  </div>
                )}

                <Card>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <SectionLabel>{t('arrivals.common.vehicles')}</SectionLabel>
                      <p className="text-xs font-semibold text-warning">
                        {t('arrivals.bacenta.oneFormPerVehicle')}
                      </p>
                    </div>

                    {bussing?.vehicleRecords?.length ? (
                      <div className="space-y-2">
                        {bussing.vehicleRecords.map((record, index) => (
                          <VehicleRow
                            key={record.id ?? index}
                            record={record}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                        {t('arrivals.bacenta.noVehiclesAdded')}
                      </p>
                    )}

                    <Button
                      size="lg"
                      className="w-full gap-2 bg-arrivals text-white hover:bg-arrivals/90"
                      disabled={!canAddVehicle}
                      onClick={() => {
                        clickCard(bacenta)
                        clickCard(bussing)
                        navigate('/arrivals/submit-vehicle-record')
                      }}
                    >
                      <Plus className="size-4" />
                      {t('arrivals.common.addVehicle')}
                    </Button>
                  </CardContent>
                </Card>

              </section>
            </div>

            {/* Too-late modal */}
            <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('arrivals.bacenta.tooLateDialogTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('arrivals.bacenta.tooLateDialogDescription')}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-center text-lg font-semibold">
                  {t('arrivals.bacenta.tooLateToFill')}
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    {t('arrivals.common.close')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Code of the Day — fullscreen */}
            <Dialog
              open={showCodeFullscreen}
              onOpenChange={setShowCodeFullscreen}
            >
              <DialogContent
                className="flex h-svh w-screen max-w-none flex-col items-center justify-center gap-6 rounded-none border-0 bg-background p-6 sm:max-w-none"
                showCloseButton={false}
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>{t('arrivals.bacenta.codeOfDay')}</DialogTitle>
                  <DialogDescription>
                    {t('arrivals.bacenta.fullscreenCodeDescription')}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('arrivals.bacenta.codeOfDay')}
                </p>
                <p className="break-all text-center font-mono text-[clamp(4rem,22vw,16rem)] font-black leading-none tabular-nums text-foreground dark:text-yellow-300">
                  {bacenta?.arrivalsCodeOfTheDay ?? '—'}
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-4"
                  onClick={() => setShowCodeFullscreen(false)}
                >
                  {t('arrivals.common.close')}
                </Button>
              </DialogContent>
            </Dialog>

            {/* Bus payment details dialog */}
            <UpdateBusPaymentDialog
              open={editBussingOpen}
              onOpenChange={setEditBussingOpen}
            />

            {/* Mobilisation picture lightbox */}
            <Dialog open={showMobPic} onOpenChange={setShowMobPic}>
              <DialogContent className="flex max-h-svh max-w-[95vw] flex-col items-center gap-4 p-4 sm:max-w-xl">
                <DialogHeader className="sr-only">
                  <DialogTitle>{t('arrivals.common.mobilisationPicture')}</DialogTitle>
                  <DialogDescription>
                    {t('arrivals.bacenta.submittedMobilisationPicture')}
                  </DialogDescription>
                </DialogHeader>
                {bussing?.mobilisationPicture && (
                  <img
                    src={bussing.mobilisationPicture}
                    alt={t('arrivals.common.preMobilisation')}
                    className="max-h-[75svh] w-full rounded-lg object-contain"
                  />
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowMobPic(false)}
                >
                  {t('arrivals.common.close')}
                </Button>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BacentaArrivals
