import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import RoleView from 'auth/RoleView'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Separator } from 'components/ui/separator'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import {
  Church,
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
import useSetUserChurch from 'hooks/useSetUserChurch'
import { MapPin, Pencil } from 'lucide-react'
import { BacentaWithArrivals } from 'pages/arrivals/arrivals-types'
import { DetailsArray } from 'pages/directory/display/DetailsBacenta'
import UpdateBusPaymentDialog from 'pages/directory/update/UpdateBusPaymentDialog'
import { permitAdmin } from 'permission-utils'
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  vacationCount?: number
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
  const { setUserChurch } = useSetUserChurch()
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

  const identityBlock = (
    <>
      <LeaderAvatar leader={props.leader} leaderTitle={props.leaderTitle} />

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
          setUserChurch({
            id: props.churchId,
            name: props.name,
            __typename: props.churchType,
          })
          navigate('/trends')
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
            setUserChurch({
              id: props.churchId,
              name: props.name,
              __typename: props.churchType,
            })
            navigate('/services')
          }}
        >
          Service Forms
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
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3">
          <Breadcrumb breadcrumb={props.breadcrumb} />
          <div className="flex items-center justify-between mt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              {props.name}{' '}
              <span className="text-members">{props.churchType}</span>
            </h1>
            {directoryLock(currentUser, props.churchType) && (
              <RoleView roles={props.editPermitted} directoryLock>
                <EditButton link={props.editlink} />
              </RoleView>
            )}
          </div>

          {needsAdmin && (
            <RoleView roles={roles}>
              <div className="flex items-center gap-2 mt-2">
                {props.admin && (
                  <MemberAvatarWithName
                    member={props.admin}
                    onClick={() => {
                      clickCard(props.admin)
                      navigate('/member/displaydetails')
                    }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={handleShow}
                >
                  <Pencil className="h-3 w-3" />
                  Change Admin
                </Button>
              </div>
            </RoleView>
          )}
        </div>
      </div>

      {/* Bus payment details dialog */}
      {props.churchType === 'Bacenta' && (
        <UpdateBusPaymentDialog
          open={editBussingOpen}
          onOpenChange={setEditBussingOpen}
        />
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
                      onClick={() => navigate(detail.link)}
                      heading={detail.title}
                      detail={
                        !props.loading ? detail?.number?.toString() || '0' : ''
                      }
                      vacationCount={
                        !props.loading
                          ? detail?.vacationCount?.toString() || '0'
                          : ''
                      }
                      vacationIcBacentaCount={
                        !props.loading
                          ? detail?.vacationIcBacentaCount?.toString() || '0'
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
                    {/* Mobile: chip buttons */}
                    <div className="flex flex-wrap gap-2 lg:hidden">
                      {props.buttons.slice(0, 5).map((church, index) => (
                        <ChurchButton key={index} church={church} />
                      ))}
                    </div>
                    {/* Desktop: stacked rows */}
                    <div className="hidden lg:block divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                      {props.buttons.slice(0, 5).map((church, index) => (
                        <ChurchRow key={index} church={church} />
                      ))}
                    </div>
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
