import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import RoleView from 'auth/RoleView'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Separator } from 'components/ui/separator'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import {
  Church,
  ChurchIdAndName,
  ChurchLevel,
  MemberWithoutBioData,
  Role,
  VacationStatusOptions,
} from 'global-types'
import {
  alertMsg,
  directoryLock,
  plural,
  throwToSentry,
} from 'global-utils'
import useModal from 'hooks/useModal'
import { ChevronRight, MapPin, Pencil, PencilLine, XCircle } from 'lucide-react'
import { BacentaWithArrivals } from 'pages/arrivals/arrivals-types'
import { DetailsArray } from 'pages/directory/display/DetailsBacenta'
import UpdateBusPaymentDialog from 'pages/directory/update/UpdateBusPaymentDialog'
import { permitAdmin } from 'permission-utils'
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchMember from 'components/formik/SearchMember'
import SubmitButton from 'components/formik/SubmitButton'
import * as Yup from 'yup'
import Breadcrumb, { BreadcrumbType } from './Breadcrumb'
import {
  MAKE_CAMPUS_ADMIN,
  MAKE_COUNCIL_ADMIN,
  MAKE_GOVERNORSHIP_ADMIN,
  MAKE_OVERSIGHT_ADMIN,
  MAKE_STREAM_ADMIN,
} from './AdminMutations'
import EditButton from 'components/buttons/EditButton'
import CloseDownBacentaButton from 'components/buttons/CloseDownBacentaButton'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import Last3WeeksCard, {
  Last3WeeksCardProps,
  shouldFill,
} from 'components/Last3WeeksCard'
import DetailsCard from 'components/card/DetailsCard'
import Timeline, { TimelineElement } from 'components/Timeline/Timeline'
import ViewAll from 'components/buttons/ViewAll'
import ChurchButton from 'components/buttons/ChurchButton/ChurchButton'
import ChurchRow from 'components/buttons/ChurchButton/ChurchRow'
import { displayError, isPermissionError } from 'utils/errorHandler'

type DisplayChurchDetailsProps = {
  details: DetailsArray
  loading: boolean
  church?: BacentaWithArrivals
  name: string
  leaderTitle: string
  leader: MemberWithoutBioData
  admin?: MemberWithoutBioData
  deputyLeader?: MemberWithoutBioData
  churchId: string
  churchType: ChurchLevel
  subChurch?: ChurchLevel
  editlink: string
  editPermitted: Role[]
  history: TimelineElement[]
  breadcrumb: BreadcrumbType[]
  buttons: Church[]
  vacation?: VacationStatusOptions
  momoNumber?: string
  location?: {
    longitude: number
    latitude: number
  }
  last3Weeks?: Last3WeeksCardProps['last3Weeks']
}

type FormOptions = {
  adminName: string
  adminSelect: string
}

const DisplayChurchDetails = (props: DisplayChurchDetailsProps) => {
  const navigate = useNavigate()
  let needsAdmin = false
  let roles: Role[] = []

  switch (props.churchType) {
    case 'Governorship':
      needsAdmin = true
      roles = permitAdmin('Council')
      break
    case 'Council':
      needsAdmin = true
      roles = permitAdmin('Stream')
      break
    case 'Stream':
      needsAdmin = true
      roles = permitAdmin('Campus')
      break
    case 'Campus':
      needsAdmin = true
      roles = permitAdmin('Oversight')
      break
    case 'Oversight':
      needsAdmin = true
      roles = permitAdmin('Denomination')
      break
    case 'Denomination':
      needsAdmin = true
      roles = []
      break
    default:
      needsAdmin = false
      break
  }

  const { currentUser } = useContext(MemberContext)
  const { show, handleShow, handleClose } = useModal()
  const [editBussingOpen, setEditBussingOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const { governorshipId, councilId, streamId, campusId, clickCard } =
    useContext(ChurchContext)

  const [MakeGovernorshipAdmin] = useMutation(MAKE_GOVERNORSHIP_ADMIN)
  const [MakeCouncilAdmin] = useMutation(MAKE_COUNCIL_ADMIN)
  const [MakeStreamAdmin] = useMutation(MAKE_STREAM_ADMIN)
  const [MakeCampusAdmin] = useMutation(MAKE_CAMPUS_ADMIN)
  const [MakeOversightAdmin] = useMutation(MAKE_OVERSIGHT_ADMIN)

  const initialValues: FormOptions = {
    adminName: props.admin
      ? `${props.admin?.firstName} ${props.admin?.lastName}`
      : '',
    adminSelect: props.admin?.id ?? '',
  }
  const validationSchema = Yup.object({
    adminSelect: Yup.string().required(
      'Please select an Admin from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    if (initialValues.adminSelect === values.adminSelect) return

    try {
      if (props.churchType === 'Oversight') {
        await MakeOversightAdmin({
          variables: {
            oversightId: props.churchId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
        alertMsg('Oversight Admin has been changed successfully')
      }

      if (props.churchType === 'Campus') {
        await MakeCampusAdmin({
          variables: {
            campusId: campusId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
        alertMsg('Campus Admin has been changed successfully')
      }

      if (props.churchType === 'Stream') {
        await MakeStreamAdmin({
          variables: {
            streamId: streamId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
        alertMsg('Stream Admin has been changed successfully')
      }

      if (props.churchType === 'Council') {
        await MakeCouncilAdmin({
          variables: {
            councilId: councilId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
        alertMsg('Council Admin has been changed successfully')
      }

      if (props.churchType === 'Governorship') {
        await MakeGovernorshipAdmin({
          variables: {
            governorshipId: governorshipId,
            newAdminId: values.adminSelect,
            oldAdminId: initialValues.adminSelect || 'no-old-admin',
          },
        })
        alertMsg('Governorship Admin has been changed successfully')
      }
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry('Error changing admin', e)
      }
      displayError('Unable to Change Admin', e)
    } finally {
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      handleClose()
    }
  }

  const adminInitials = props.admin
    ? `${props.admin?.firstName?.[0] ?? ''}${props.admin?.lastName?.[0] ?? ''}`
    : ''

  const identityBlock = (
    <>
      <div>
        <LeaderAvatar leader={props.leader} leaderTitle={props.leaderTitle} />

        {needsAdmin && (props.admin || roles.length > 0) && (
          <div className="flex items-center gap-2 -mt-2">
            {props.admin && (
              <Link
                to="/member/displaydetails"
                onClick={() => clickCard(props.admin)}
                className="flex min-h-11 min-w-0 items-center gap-2 no-underline transition-opacity hover:opacity-80"
              >
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Admin
                </span>
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage
                    src={props.admin.pictureUrl}
                    alt={`${props.admin.firstName} ${props.admin.lastName}`}
                  />
                  <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                    {adminInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-medium text-foreground">
                  {props.admin.firstName} {props.admin.lastName}
                </span>
              </Link>
            )}
            <RoleView roles={roles}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                onClick={handleShow}
              >
                <Pencil className="h-3 w-3" />
                {props.admin ? 'Change' : 'Add Admin'}
              </Button>
            </RoleView>
          </div>
        )}
      </div>

      {props.churchType === 'Bacenta' && (
        <div className="space-y-2">
          {props.deputyLeader && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 shrink-0">
                Deputy Leader
              </span>
              <MemberAvatarWithName member={props.deputyLeader} />
            </div>
          )}
          {props.admin && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 shrink-0">
                Bacenta Admin
              </span>
              <MemberAvatarWithName member={props.admin} />
            </div>
          )}
        </div>
      )}
    </>
  )

  const busPaymentBlock =
    props.churchType === 'Bacenta' &&
    (props.church?.sprinterTopUp !== 0 || props.church?.urvanTopUp !== 0) ? (
      <RoleView roles={['leaderBacenta']} verifyId={props?.leader?.id}>
        {!props.momoNumber && !props.loading && (
          <p className="text-sm font-semibold text-destructive text-center">
            There is no valid Mobile Money Number! Please update!
          </p>
        )}
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setEditBussingOpen(true)}
        >
          Bus Payment Details
        </Button>
      </RoleView>
    ) : null

  const actionButtonsBlock = (
    <div className="space-y-3">
      <Button
        className="w-full"
        size="lg"
        onClick={() => {
          navigate('/trends', {
            state: {
              overrideChurch: {
                id: props.churchId,
                name: props.name,
                __typename: props.churchType,
              } satisfies ChurchIdAndName,
            },
          })
        }}
      >
        View Trends
      </Button>

      {shouldFill({
        last3Weeks: props.last3Weeks ?? [],
        vacation: props.vacation ?? 'Active',
      }) && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            if (props.churchType === 'Bacenta') {
              clickCard({
                id: props.churchId,
                name: props.name,
                __typename: props.churchType,
              })
              setRecordDialogOpen(true)
              return
            }
            navigate('/services', {
              state: {
                overrideChurch: {
                  id: props.churchId,
                  name: props.name,
                  __typename: props.churchType,
                } satisfies ChurchIdAndName,
              },
            })
          }}
        >
          {props.churchType === 'Bacenta' ? 'Fill Service Form' : 'Service Forms'}
        </Button>
      )}
    </div>
  )

  const locationBlock =
    props?.location && props.location?.latitude !== 0 ? (
      <div className="text-center py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Location
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Click for directions
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${props?.location?.latitude}%2C${props?.location?.longitude}`}
          className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted hover:bg-muted/80 active:bg-muted/80 transition-colors"
        >
          <MapPin className="h-8 w-8 text-[hsl(var(--maps))]" />
        </a>
      </div>
    ) : null

  const last3WeeksBlock =
    props.last3Weeks && props.details[2]?.number === 'Active' ? (
      <Last3WeeksCard last3Weeks={props.last3Weeks} />
    ) : null

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-16 md:px-4 lg:px-6 py-3">
          <Breadcrumb breadcrumb={props.breadcrumb} />
          <div className="flex items-center justify-between mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              {props.name}{' '}
              <span className="text-members">{props.churchType}</span>
            </h1>
            {directoryLock(currentUser, props.churchType) && (
              <RoleView roles={props.editPermitted} directoryLock>
                <div className="flex items-center gap-2">
                  <EditButton link={props.editlink} />
                  {props.churchType === 'Bacenta' && props.leader?.id && (
                    <CloseDownBacentaButton
                      bacentaId={props.churchId}
                      bacentaName={props.name}
                      leaderId={props.leader.id}
                    />
                  )}
                </div>
              </RoleView>
            )}
          </div>

        </div>
      </div>

      {/* Bus payment details dialog */}
      {props.churchType === 'Bacenta' && (
        <UpdateBusPaymentDialog
          open={editBussingOpen}
          onOpenChange={setEditBussingOpen}
        />
      )}

      {/* Fill Service Form dialog (Bacenta only) */}
      {props.churchType === 'Bacenta' && (
        <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record this week&apos;s service</DialogTitle>
              <DialogDescription>
                Did the service take place this week?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRecordDialogOpen(false)
                  navigate('/bacenta/record-service')
                }}
                className="group flex min-h-[64px] w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-members/10 text-members">
                  <PencilLine className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Record Service
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We met this week — fill the service form
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecordDialogOpen(false)
                  navigate('/services/bacenta/no-service')
                }}
                className="group flex min-h-[64px] w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <XCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    I Cancelled My Service
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No service this week — give a reason
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Admin Dialog */}
      <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {(formik) => (
              <Form>
                <DialogHeader>
                  <DialogTitle>Change {props.churchType} Admin</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <SearchMember
                    name="adminSelect"
                    initialValue={initialValues?.adminName}
                    placeholder="Select an Admin"
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="Member Search"
                    error={formik.errors.adminSelect}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={handleClose}>
                    Close
                  </Button>
                  <SubmitButton formik={formik} />
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5 lg:py-8">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">
          {/* LEFT — identity panel (desktop only) */}
          <aside className="hidden lg:flex lg:flex-col lg:gap-5 lg:sticky lg:top-40 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-6">
            {identityBlock}
            {busPaymentBlock}
            {actionButtonsBlock}
            {locationBlock}
          </aside>

          {/* MAIN content */}
          <div className="space-y-5 min-w-0">
            {/* Mobile-only identity */}
            <div className="space-y-5 lg:hidden">{identityBlock}</div>

            {/* Detail stat cards */}
            {props.details?.length > 0 && (
              <div className="grid grid-cols-2 gap-0">
                {props.details.map((detail, i) => (
                  <div
                    key={i}
                    className={detail.width === 12 ? 'col-span-2' : 'col-span-1'}
                  >
                    <DetailsCard
                      onClick={detail.onClick ?? (() => navigate(detail.link))}
                      heading={detail.title}
                      detail={
                        !props.loading ? detail?.number?.toString() || '0' : ''
                      }
                      vacationCount={
                        !props.loading
                          ? detail?.vacationCount?.toString() || '0'
                          : ''
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Last 3 weeks — desktop placement (alongside stats) */}
            <div className="hidden lg:block">{last3WeeksBlock}</div>

            {/* Mobile-only actions + location */}
            <div className="space-y-5 lg:hidden">
              {busPaymentBlock}
              {actionButtonsBlock}
              {locationBlock}
            </div>

            {/* Last 3 weeks — mobile placement (after location, original order) */}
            <div className="lg:hidden">{last3WeeksBlock}</div>
          </div>
        </div>

        {/* Bottom section — sub-churches (left) + history (right) on lg+ */}
        {!props.loading && (props.subChurch || props.history?.length > 0) && (
          <div className="mt-8 lg:mt-10">
            <Separator className="mb-6" />
            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">
              {/* LEFT — sub-churches (empty on Bacenta) */}
              <div>
                {props.subChurch && props.buttons?.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {`${props.subChurch} Locations`}
                      </h3>
                      <ViewAll
                        to={`/${props.subChurch.toLowerCase()}/displayall`}
                        label={`View All ${plural(props.subChurch)}`}
                      />
                    </div>
                    {(() => {
                      const PREVIEW_LIMIT = 3
                      const visible = props.buttons.slice(0, PREVIEW_LIMIT)
                      const remaining = Math.max(
                        0,
                        props.buttons.length - PREVIEW_LIMIT
                      )
                      const moreHref = `/${props.subChurch?.toLowerCase()}/displayall`

                      return (
                        <>
                          {/* Mobile: chip buttons */}
                          <div className="flex flex-wrap gap-2 lg:hidden">
                            {visible.map((church, index) => (
                              <ChurchButton key={index} church={church} />
                            ))}
                            {remaining > 0 && (
                              <Link to={moreHref}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 border-dashed text-nowrap text-members hover:bg-members/10 hover:text-members"
                                >
                                  +{remaining} more
                                  <ChevronRight className="size-3.5" />
                                </Button>
                              </Link>
                            )}
                          </div>
                          {/* Desktop: stacked rows */}
                          <div className="hidden lg:block divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                            {visible.map((church, index) => (
                              <ChurchRow key={index} church={church} />
                            ))}
                            {remaining > 0 && (
                              <Link
                                to={moreHref}
                                className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50 active:bg-muted"
                              >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-members/10">
                                  <span className="text-xs font-semibold text-members">
                                    +{remaining}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-base font-semibold text-members">
                                    {`${remaining} more ${
                                      remaining === 1
                                        ? props.subChurch
                                        : plural(props.subChurch)
                                    }`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Show all
                                  </p>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                              </Link>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </>
                )}

                {props.subChurch && !props.buttons?.length && (
                  <RoleView roles={props.editPermitted}>
                    <Button
                      className="w-full sm:w-auto"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/${props.subChurch?.toLowerCase()}/add${props.subChurch?.toLowerCase()}`
                        )
                      }
                    >
                      {`Add New ${props.subChurch}`}
                    </Button>
                  </RoleView>
                )}
              </div>

              {/* RIGHT — church history */}
              <div>
                {props.history?.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Church History
                      </h3>
                      <ViewAll
                        to={`/${props.churchType.toLowerCase()}/history`}
                      />
                    </div>
                    <Timeline entries={(props.history ?? []).slice(0, 5)} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DisplayChurchDetails
