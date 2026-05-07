import { useContext, useEffect } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import Timeline from 'components/Timeline/Timeline'
import MemberRoleList, { getRank } from 'components/MemberRoleList'
import { throwToSentry, USER_PLACEHOLDER } from 'global-utils'
import { getMemberDob } from 'jd-date-utils'
import {
  DISPLAY_MEMBER_ADMIN,
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
  DISPLAY_MEMBER_LEADERSHIP,
} from 'pages/directory/display/ReadQueries'
import { Member, MemberWithChurches } from 'global-types'
import { permitAdmin, permitLeader } from 'permission-utils'
import {
  Phone,
  Save,
  StickyNote,
  MessageCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import useModal from 'hooks/useModal'
import { Field, Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { Textarea } from 'components/ui/textarea'
import { Label } from 'components/ui/label'
import { UPDATE_MEMBER_STICKY_NOTE } from 'pages/directory/update/UpdateMutations'
import { displayError, isPermissionError } from 'utils/errorHandler'
import RoleView from 'auth/RoleView'
import EditButton from 'components/buttons/EditButton'
import ViewAll from 'components/buttons/ViewAll'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Separator } from 'components/ui/separator'
import { Skeleton } from 'components/ui/skeleton'
import { Badge } from 'components/ui/badge'
import { cn } from 'components/lib/utils'

// ── Utilities ────────────────────────────────────────────────────────────────

const generateVCard = async (member: Member, roles: string) => {
  let base64Image = ''
  if (member.pictureUrl) {
    const response = await fetch(member.pictureUrl)
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)
    let binaryData = ''
    uint8.forEach((byte) => {
      binaryData += String.fromCharCode(byte)
    })
    base64Image = window.btoa(binaryData)
  }

  return `BEGIN:VCARD\nVERSION:3.0\nN:${member.lastName};${member.firstName};${
    member.middleName?.trim() !== '' ? member.middleName + ';' : ''
  }${!!member.currentTitle ? member.currentTitle + ';' : ''}\nFN:${
    member.nameWithTitle
  }\nORG:FLC ${member?.bacenta?.council?.name ?? ''} Council;${
    member.email
      ? '\nEMAIL;type=INTERNET;type=HOME;type=pref:' + member.email
      : ''
  }\nTEL;type=CELL;type=VOICE;type=pref:+${member.phoneNumber}\n${
    member.whatsappNumber !== member.phoneNumber
      ? `;TYPE=HOME:+${member.whatsappNumber}`
      : ''
  }\nNOTE:Visitation Landmark: ${member.visitationArea}\\nOccupation: ${
    member.occupation.occupation || 'None'
  }\\nMarital Status: ${
    member.maritalStatus.status
  }\\n\\nRoles in Church:\\n${roles}\n${
    base64Image ? 'PHOTO;ENCODING=b;TYPE=JPEG:' + base64Image + '\n' : ''
  }BDAY:${member.dob.date}\nADR;TYPE=HOME:;;;;${
    member.visitationArea
  };;\nEND:VCARD`
}

const returnStringMemberRoles = (
  memberLeader: MemberWithChurches | undefined,
  memberAdmin: MemberWithChurches | undefined
) => {
  const rank = getRank(
    memberLeader as MemberWithChurches,
    memberAdmin as MemberWithChurches
  )
  const arrayOfRoles: string[] = []

  Object.entries(rank).forEach(([, entries]) => {
    if (entries.length > 0) {
      const place = entries[0]
      const servant = place.admin ? 'Admin' : 'Leader'
      arrayOfRoles.push(`${place.__typename} ${servant}: ${place.name}`)
    }
  })

  return arrayOfRoles.join('\\n')
}

// ── InfoRow ──────────────────────────────────────────────────────────────────

type InfoRowProps = {
  label: string
  value?: string | null
  loading?: boolean
  mono?: boolean
  /** Set true when InfoRow is inside a grid pair — border is on the wrapper */
  noBorder?: boolean
}

const InfoRow = ({ label, value, loading, mono, noBorder }: InfoRowProps) => {
  const rowClass = cn(
    'py-3',
    !noBorder && 'border-b border-border last:border-0'
  )

  if (loading) {
    return (
      <div className={rowClass}>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <Skeleton className="h-5 w-40" />
      </div>
    )
  }
  if (!value) return null

  return (
    <div className={rowClass}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={cn(
          'text-sm font-medium text-foreground',
          mono && 'font-mono'
        )}
      >
        {value}
      </p>
    </div>
  )
}

// ── MemberDisplay ─────────────────────────────────────────────────────────────

const MemberDisplay = ({ memberId }: { memberId: string }) => {
  const {
    data: bioData,
    loading: bioLoading,
    error,
  } = useQuery(DISPLAY_MEMBER_BIO, {
    variables: { id: memberId },
  })
  const { data: churchData, loading: churchLoading } = useQuery(
    DISPLAY_MEMBER_CHURCH,
    { variables: { id: memberId } }
  )
  const { data: leaderData, loading: leaderLoading } = useQuery(
    DISPLAY_MEMBER_LEADERSHIP,
    { variables: { id: memberId } }
  )
  const { data: adminData, loading: adminLoading } = useQuery(
    DISPLAY_MEMBER_ADMIN,
    { variables: { id: memberId } }
  )

  const loading = bioLoading || churchLoading || leaderLoading || adminLoading
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (error) throwToSentry('Error loading member', error)
  }, [error])

  const member: Member = bioData?.members[0]
  const memberChurch = churchData?.members[0]
  const memberLeader = leaderData?.members[0]
  const memberAdmin = adminData?.members[0]
  const memberBirthday = getMemberDob(member)
  const roles = returnStringMemberRoles(memberLeader, memberAdmin)
  const hasRoles =
    memberLeader && memberAdmin
      ? Object.values(getRank(memberLeader, memberAdmin)).flat().length > 0
      : false

  const [UpdateMemberStickyNote, { loading: noteLoading }] = useMutation(
    UPDATE_MEMBER_STICKY_NOTE
  )
  const { show, handleShow, handleClose } = useModal()
  const initialValues = { note: member?.stickyNote ?? '' }
  const validationSchema = Yup.object({
    note: Yup.string().required('Note is required'),
  })

  const onSubmit = async (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await UpdateMemberStickyNote({
        variables: {
          id: memberId,
          stickyNote: values.note,
          ids: [memberId],
          historyRecord: `Added Sticky Note: ${values.note}`,
        },
      })
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry('Error saving sticky note', e)
      }
      displayError('Could not save note', e)
    } finally {
      onSubmitProps.setSubmitting(false)
      handleClose()
    }
  }

  const onDelete = async () => {
    try {
      await UpdateMemberStickyNote({
        variables: {
          id: memberId,
          stickyNote: '',
          ids: [memberId],
          historyRecord: `Deleted Sticky Note`,
        },
      })
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry('Error deleting sticky note', e)
      }
      displayError('Could not delete note', e)
    } finally {
      handleClose()
    }
  }

  const initials = member
    ? `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`
    : ''

  const hasStickyNote = member?.stickyNote && member.stickyNote.trim() !== ''

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Sticky Note Dialog */}
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
                  <DialogTitle>Add or Update Sticky Note</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-arrivals">
                      This note will be visible to all Admins and Leaders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can put Room Number, Special Instructions etc
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note">Note</Label>
                    <Field
                      as={Textarea}
                      id="note"
                      name="note"
                      rows={4}
                      placeholder="e.g. Room 12B, prefers WhatsApp over calls"
                      aria-invalid={
                        !!(formik.touched.note && formik.errors.note)
                      }
                    />
                    {formik.touched.note && formik.errors.note && (
                      <p className="text-xs text-destructive">
                        {formik.errors.note}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                    disabled={noteLoading}
                  >
                    {noteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Delete Note'
                    )}
                  </Button>
                  <Button type="submit" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save Note'
                    )}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* ── Top action bar — full width, sticky ──
          Height: py-3 (24px) + min-h-[44px] button + border-b (1px) = 69px.
          Left aside uses lg:top-[69px] to match. */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <RoleView
            roles={[
              ...permitAdmin('Governorship'),
              ...permitLeader('Bacenta'),
            ]}
          >
            <EditButton link="/member/editmember" />
          </RoleView>

          <RoleView roles={['all']} verifyNotId={member?.id}>
            <Button
              variant="outline"
              onClick={handleShow}
              disabled={bioLoading}
              className="min-h-[44px] gap-1.5"
            >
              <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
              Add Sticky Note
            </Button>
          </RoleView>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5 lg:py-8">
        {/* ── 2-column grid (lg+) / single column (mobile) ── */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:items-stretch">
          {/* ── LEFT: Identity + contact + membership ── */}
          <aside className="rounded-xl border border-border bg-card overflow-hidden h-full">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-4 p-6 pb-5">
              {loading ? (
                <>
                  <Skeleton className="h-36 w-36 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </>
              ) : (
                <>
                  <Avatar className="h-36 w-36 ring-2 ring-border ring-offset-2 ring-offset-card">
                    <AvatarImage
                      src={member?.pictureUrl || USER_PLACEHOLDER}
                      alt={member?.fullName}
                    />
                    <AvatarFallback className="text-4xl font-semibold bg-muted">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center space-y-1 w-full">
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {member?.nameWithTitle}
                    </h2>
                    {member?.currentTitle && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {member.currentTitle}
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2 min-h-[44px]"
                    onClick={async () => {
                      if (!member) return
                      try {
                        const vCard = await generateVCard(
                          { ...member, ...memberChurch },
                          roles
                        )
                        const blob = new Blob([vCard], { type: 'text/vcard' })
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${member.nameWithTitle}.vcf`
                        a.click()
                        window.URL.revokeObjectURL(url)
                      } catch (e) {
                        throwToSentry('Error generating vCard', e)
                        displayError('Could not save contact', e)
                      }
                    }}
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save Contact
                  </Button>
                </>
              )}
            </div>

            {/* Contact rows */}
            <div className="border-t border-border divide-y divide-border">
              {loading ? (
                <>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <a
                    href={`tel:${member?.phoneNumber}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors min-h-[64px]"
                  >
                    <div className="h-11 w-11 rounded-full bg-arrivals/10 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-arrivals" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-base font-mono font-bold tabular-nums truncate">
                        +{member?.phoneNumber}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  </a>

                  {/* whatsapp:// is intercepted by the OS and returns the user
                      to the PWA — safer than wa.me (HTTPS) in standalone mode */}
                  <a
                    href={`whatsapp://send?phone=${member?.whatsappNumber}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors min-h-[64px]"
                  >
                    <div className="h-11 w-11 rounded-full bg-banking/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5 text-banking" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="text-base font-mono font-bold tabular-nums truncate">
                        +{member?.whatsappNumber}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  </a>
                </>
              )}
            </div>

            {/* Church membership */}
            {(memberChurch?.bacenta ||
              memberChurch?.basonta ||
              churchLoading) && (
              <div className="border-t border-border">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Church Membership
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {churchLoading ? (
                    <div className="px-4 py-3">
                      <Skeleton className="h-3 w-16 mb-1.5" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  ) : (
                    <>
                      {memberChurch?.bacenta && (
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors min-h-[56px]"
                          onClick={() => {
                            clickCard(memberChurch?.bacenta)
                            navigate('/bacenta/displaydetails')
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground mb-0.5">
                              Bacenta
                            </p>
                            <p className="text-sm font-medium text-foreground truncate">
                              {memberChurch?.bacenta?.name}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      )}
                      {/* Basonta is informational — no navigation target */}
                      {memberChurch?.basonta && (
                        <div className="px-4 py-3">
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Basonta
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {memberChurch?.basonta?.name}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* ── RIGHT: Sticky note + bio data ── */}
          <div className="space-y-4">
            {/* Sticky note */}
            {bioLoading ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : hasStickyNote ? (
              <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="h-4 w-4 text-warning" aria-hidden="true" />
                  <span className="text-sm font-semibold text-warning">
                    Sticky Note
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {member.stickyNote}
                </p>
              </div>
            ) : null}

            {/* Personal Information */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 lg:px-5 py-3 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Personal Information
                </h3>
              </div>
              <div className="px-4 lg:px-5">
                {bioLoading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="py-3 border-b border-border last:border-0"
                      >
                        <Skeleton className="h-3 w-20 mb-1.5" />
                        <Skeleton className="h-5 w-36" />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Pair rows: border on wrapper, not on individual InfoRow */}
                    <div className="grid grid-cols-2 border-b border-border">
                      <InfoRow
                        label="First Name"
                        value={member?.firstName}
                        noBorder
                      />
                      <InfoRow
                        label="Last Name"
                        value={member?.lastName}
                        noBorder
                      />
                    </div>
                    {member?.middleName && (
                      <InfoRow label="Middle Name" value={member?.middleName} />
                    )}
                    <div className="grid grid-cols-2 border-b border-border">
                      <InfoRow
                        label="Gender"
                        value={member?.gender?.gender}
                        noBorder
                      />
                      <InfoRow
                        label="Marital Status"
                        value={member?.maritalStatus?.status}
                        noBorder
                      />
                    </div>
                    <InfoRow
                      label="Date of Birth"
                      value={memberBirthday || undefined}
                    />
                    {member?.occupation?.occupation && (
                      <InfoRow
                        label="Occupation"
                        value={member?.occupation?.occupation}
                      />
                    )}
                    {member?.email && (
                      <InfoRow
                        label="Email Address"
                        value={member?.email}
                        mono
                      />
                    )}
                    {member?.visitationArea && (
                      <InfoRow
                        label="Location for IDL"
                        value={member?.visitationArea.toString()}
                      />
                    )}
                    {member?.currentTitle && (
                      <InfoRow
                        label="Pastoral Rank"
                        value={member.currentTitle}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Leadership Roles — only rendered when member actually holds a role */}
            {adminLoading || leaderLoading ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="px-4 py-1">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="py-3 border-b border-border last:border-0">
                      <Skeleton className="h-2.5 w-24 mb-1.5" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  ))}
                </div>
              </div>
            ) : hasRoles ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Leadership Roles
                  </p>
                </div>
                <div className="px-2 py-2">
                  <MemberRoleList
                    memberLeader={memberLeader}
                    memberAdmin={memberAdmin}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Church history — mirrors top 2-column grid; left column is intentional negative space ── */}
        {memberChurch?.history?.length > 0 && (
          <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr]">
            <div aria-hidden="true" className="hidden lg:block" />
            <div>
              <Separator className="mb-6" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Church History
                </h3>
                <ViewAll to="/member/history" />
              </div>
              <Timeline entries={(memberChurch.history ?? []).slice(0, 3)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemberDisplay
