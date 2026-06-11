import { useMutation, useQuery } from '@apollo/client'
import { Formik, Form, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useState } from 'react'
import { toast } from 'sonner'
import { parseNeoTime } from 'lib/date-utils'
import {
  AlertTriangle,
  BellRing,
  BusFront,
  Clock,
  Info,
  Megaphone,
  Pencil,
  Timer,
} from 'lucide-react'

import { ChurchContext } from 'contexts/ChurchContext'
import { throwToSentry } from 'global-utils'
import { Alert, AlertDescription, AlertTitle } from 'components/ui/alert'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'
import FormikInput from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

import { GET_ARRIVAL_TIMES, SET_STREAM_ARRIVAL_TIMES } from './time-gql'

type FormValues = {
  mobilisationStartTime: string
  mobilisationEndTime: string
  arrivalStartTime: string
  arrivalEndTime: string
}

type SlotKey = keyof FormValues

type TimeSlot = {
  key: SlotKey
  label: string
  hint: string
  icon: typeof Megaphone
  tone: 'mobilisation' | 'arrival'
}

const TIME_SLOTS: TimeSlot[] = [
  {
    key: 'mobilisationStartTime',
    label: 'Mobilisation Start',
    hint: 'Bacentas start calling members.',
    icon: Megaphone,
    tone: 'mobilisation',
  },
  {
    key: 'mobilisationEndTime',
    label: 'Mobilisation End',
    hint: 'Last window to confirm passengers.',
    icon: BellRing,
    tone: 'mobilisation',
  },
  {
    key: 'arrivalStartTime',
    label: 'Arrival Start',
    hint: 'Counters open at the auditorium.',
    icon: BusFront,
    tone: 'arrival',
  },
  {
    key: 'arrivalEndTime',
    label: 'Arrival End',
    hint: 'Last bus is counted in.',
    icon: Timer,
    tone: 'arrival',
  },
]

// `parseTimeToDate` (from `lib/date-utils`) sets hours/minutes/ms but not
// seconds, so the current second leaks into the saved ISO string. We only
// care about HH:MM here — zero seconds and ms explicitly.
const timeStringToIso = (value: string): string => {
  const [h, m] = value.split(':').map((n) => parseInt(n, 10))
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

// `parseNeoTime` returns "HH:MM:SS". Strip the seconds for display.
const formatHourMinute = (value?: string | null): string => {
  if (!value) return ''
  const parsed = parseNeoTime(value)
  return parsed ? parsed.slice(0, 5) : ''
}

const toneClasses = {
  mobilisation: {
    bg: 'bg-churches/10',
    text: 'text-churches',
  },
  arrival: {
    bg: 'bg-arrivals/10',
    text: 'text-arrivals',
  },
} as const

const ArrivalTimes = () => {
  const { streamId } = useContext(ChurchContext)
  const [editOpen, setEditOpen] = useState(false)

  const { data, loading, error, refetch } = useQuery(GET_ARRIVAL_TIMES, {
    variables: { id: streamId },
    skip: !streamId,
  })

  const stream = data?.streams?.[0]
  const streamName = stream?.name

  const [setStreamArrivalTimes] = useMutation(SET_STREAM_ARRIVAL_TIMES)

  const initialValues: FormValues = {
    mobilisationStartTime: formatHourMinute(stream?.mobilisationStartTime),
    mobilisationEndTime: formatHourMinute(stream?.mobilisationEndTime),
    arrivalStartTime: formatHourMinute(stream?.arrivalStartTime),
    arrivalEndTime: formatHourMinute(stream?.arrivalEndTime),
  }

  const validationSchema = Yup.object({
    mobilisationStartTime: Yup.string().required('Required'),
    mobilisationEndTime: Yup.string().required('Required'),
    arrivalStartTime: Yup.string().required('Required'),
    arrivalEndTime: Yup.string().required('Required'),
  })

  const onSubmit = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    if (!streamId) return
    helpers.setSubmitting(true)
    try {
      await setStreamArrivalTimes({
        variables: {
          id: streamId,
          mobilisationStartTime: timeStringToIso(values.mobilisationStartTime),
          mobilisationEndTime: timeStringToIso(values.mobilisationEndTime),
          arrivalStartTime: timeStringToIso(values.arrivalStartTime),
          arrivalEndTime: timeStringToIso(values.arrivalEndTime),
        },
      })
      await refetch()
      toast.success('Arrival times updated')
      setEditOpen(false)
    } catch (err) {
      throwToSentry('Could not update stream arrival times', err)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  const renderTimeValue = (slot: TimeSlot) => {
    if (loading && !stream) {
      return <Skeleton className="h-7 w-20" />
    }
    const value = formatHourMinute(stream?.[slot.key])
    return (
      <span
        className={cn(
          'font-mono text-2xl font-semibold tabular-nums tracking-tight',
          !value && 'text-muted-foreground'
        )}
      >
        {value || '—'}
      </span>
    )
  }

  return (
    <main className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Stream
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {streamName ? `${streamName} ` : ''}
          <span className="text-arrivals">Arrival Times</span>
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          These windows decide when mobilisation and arrival counters can
          record bussing for this stream.
        </p>
      </StickyPageHeader>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
        {!streamId && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>No stream in focus</AlertTitle>
            <AlertDescription>
              Open a stream from the arrivals dashboard first, then return
              here to view or edit its arrival times.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Could not load arrival times</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Supporting column — first in DOM so it appears above the
              primary card on mobile; placed in the right column on lg+. */}
          <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Info className="size-4" />
                How these windows work
              </div>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-foreground">
                    Mobilisation window
                  </dt>
                  <dd className="text-muted-foreground">
                    Bacenta leaders fill in expected passengers between these
                    two times. The window closes automatically at the end.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">
                    Arrival window
                  </dt>
                  <dd className="text-muted-foreground">
                    Arrival counters can confirm and pay for buses only between
                    these two times. Late buses fall outside payment.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Times apply to{' '}
              <span className="font-semibold text-foreground">
                {streamName ?? 'this stream'}
              </span>{' '}
              every Sunday until changed.
            </div>
          </aside>

          {/* Primary column — current windows. Placed in col 1 on lg+. */}
          <section className="space-y-4 lg:col-start-1 lg:row-start-1">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-4" />
                  Current Window
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  disabled={!streamId}
                  className="gap-2"
                >
                  <Pencil className="size-4" />
                  Edit Times
                </Button>
              </div>

              <ul className="divide-y divide-border">
                {TIME_SLOTS.map((slot) => {
                  const tone = toneClasses[slot.tone]
                  const Icon = slot.icon
                  return (
                    <li
                      key={slot.key}
                      className="flex items-center gap-4 px-4 py-4 lg:px-5"
                    >
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-full',
                          tone.bg
                        )}
                      >
                        <Icon className={cn('size-5', tone.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {slot.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.hint}
                        </p>
                      </div>
                      <div className="text-right">{renderTimeValue(slot)}</div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Arrival Times</DialogTitle>
            <DialogDescription>
              Update the mobilisation and arrival windows for{' '}
              <span className="font-medium text-foreground">
                {streamName ?? 'this stream'}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {/* Mount the form fresh each time the dialog opens so in-flight
              edits aren't wiped by a background refetch. */}
          {editOpen && (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              validateOnMount
              onSubmit={onSubmit}
            >
              {(formik) => (
                <Form className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {TIME_SLOTS.map((slot) => (
                      <FormikInput
                        key={slot.key}
                        type="time"
                        name={slot.key}
                        label={slot.label}
                        placeholder="Pick a time"
                      />
                    ))}
                  </div>
                  <DialogFooter className="pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <SubmitButton formik={formik}>Save Times</SubmitButton>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default ArrivalTimes
