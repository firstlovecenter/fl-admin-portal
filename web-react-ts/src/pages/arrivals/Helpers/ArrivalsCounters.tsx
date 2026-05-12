import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext, useState } from 'react'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { Loader2, Plus, UserMinus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from 'components/ui/button'
import { Skeleton } from 'components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import SubmitButton from 'components/formik/SubmitButton'
import SearchMember from 'components/formik/SearchMember'
import { throwToSentry } from 'global-utils'
import { Member } from 'global-types'
import { StreamWithArrivals } from '../arrivals-types'
import {
  MAKE_STREAMARRIVALS_COUNTER,
  REMOVE_STREAMARRIVALS_COUNTER,
  STREAM_ARRIVALS_HELPERS,
} from './ArrivalsHelpersGQL'

type FormOptions = {
  helperName: string
  helperSelect: string
}

const ArrivalsCounters = () => {
  const { streamId } = useContext(ChurchContext)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [removing, setRemoving] = useState(false)

  const { data, loading, error } = useQuery(STREAM_ARRIVALS_HELPERS, {
    variables: { id: streamId },
  })
  const stream: StreamWithArrivals | undefined = data?.streams?.[0]

  const refetchQueries = [
    {
      query: STREAM_ARRIVALS_HELPERS,
      variables: { id: streamId },
    },
  ]

  const [MakeStreamArrivalsCounter] = useMutation(MAKE_STREAMARRIVALS_COUNTER, {
    refetchQueries,
  })
  const [RemoveStreamArrivalsCounter] = useMutation(
    REMOVE_STREAMARRIVALS_COUNTER,
    { refetchQueries }
  )

  const initialValues: FormOptions = {
    helperName: '',
    helperSelect: '',
  }

  const validationSchema = Yup.object({
    helperSelect: Yup.string().required(
      'Please select a helper from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeStreamArrivalsCounter({
        variables: {
          streamId,
          arrivalsCounterId: values.helperSelect,
        },
      })
      onSubmitProps.resetForm()
      setAddOpen(false)
      toast.success('Arrivals Counter added successfully')
    } catch (e) {
      throwToSentry('', e)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await RemoveStreamArrivalsCounter({
        variables: {
          streamId,
          arrivalsCounterId: removeTarget.id,
        },
      })
      toast.success(`${removeTarget.fullName} removed successfully`)
      setRemoveTarget(null)
    } catch (e) {
      throwToSentry('', e)
    } finally {
      setRemoving(false)
    }
  }

  const counters = stream?.arrivalsCounters ?? []
  const counterCount = counters.length
  const showSkeletons = loading && !stream

  return (
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 lg:px-6 lg:py-8">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              {showSkeletons ? (
                <Skeleton className="inline-block h-8 w-72 align-middle lg:h-9" />
              ) : (
                <>
                  {stream?.name}{' '}
                  <span className="text-arrivals">Arrivals Counters</span>
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the team that counts arrivals for this stream.
            </p>
          </header>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Supporting column — first in DOM so summary sits on top on mobile.
                On lg+ it lands in column 2 (right side). */}
            <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Active counters
                    </p>
                    {showSkeletons ? (
                      <Skeleton className="mt-1 h-9 w-16" />
                    ) : (
                      <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                        {counterCount}
                      </p>
                    )}
                  </div>
                  {showSkeletons ? (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Active Bacentas
                      </p>
                      <Skeleton className="mt-1 h-6 w-12" />
                    </div>
                  ) : (
                    typeof stream?.activeBacentaCount === 'number' && (
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Active Bacentas
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                          {stream.activeBacentaCount}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 px-8 font-semibold sm:w-auto sm:min-w-64 lg:w-full"
                onClick={() => setAddOpen(true)}
                disabled={showSkeletons}
              >
                <Plus className="h-5 w-5" />
                Add Counter
              </Button>
            </aside>

            {/* Primary column — counters list. Second in DOM, column 1 on lg+. */}
            <section className="space-y-4 lg:col-start-1 lg:row-start-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Current Counters
                </h2>
                {showSkeletons ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {counterCount} {counterCount === 1 ? 'person' : 'people'}
                  </span>
                )}
              </div>

              {showSkeletons ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : counterCount === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-arrivals/10">
                    <Users className="h-6 w-6 text-arrivals" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      No arrivals counters yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add a counter to begin tracking arrivals for this stream.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {counters.map((counter) => (
                    <div key={counter.id} className="relative">
                      <MemberDisplayCard member={counter} />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${counter.fullName}`}
                        className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full text-destructive before:absolute before:-inset-2 before:content-[''] hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRemoveTarget(counter)
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>

        {/* Add counter dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Arrivals Counter</DialogTitle>
              <DialogDescription>
                Search for the member you want to add as an arrivals counter
                for this stream.
              </DialogDescription>
            </DialogHeader>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {(formik) => (
                <Form className="space-y-4">
                  <SearchMember
                    name="helperSelect"
                    initialValue={initialValues.helperName}
                    placeholder="Search for a member"
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="Member Search"
                    error={formik.errors.helperSelect}
                  />

                  <DialogFooter className="sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setAddOpen(false)}
                      disabled={formik.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <SubmitButton formik={formik}>Add Counter</SubmitButton>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>

        {/* Remove confirmation */}
        <AlertDialog
          open={!!removeTarget}
          onOpenChange={(open) => {
            if (!open && !removing) setRemoveTarget(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove counter?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{' '}
                <span className="font-semibold text-foreground">
                  {removeTarget?.fullName}
                </span>{' '}
                as an arrivals counter? They will no longer be able to count
                arrivals for this stream.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={removing}
                className="h-11 min-h-11"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleRemove()
                }}
                disabled={removing}
                className="h-11 min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing…
                  </>
                ) : (
                  'Remove'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ApolloWrapper>
  )
}

export default ArrivalsCounters
