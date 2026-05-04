import { useContext } from 'react'
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
import { Member } from 'global-types'
import { permitAdmin, permitLeader } from 'permission-utils'
import { BarLoader } from 'react-spinners'
import {
  Phone,
  Save,
  StickyNote,
  MessageCircle,
  Loader2,
} from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import useModal from 'hooks/useModal'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import Textarea from 'components/formik/Textarea'
import { UPDATE_MEMBER_STICKY_NOTE } from '../update/UpdateMutations'
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

  const vCard = `BEGIN:VCARD\nVERSION:3.0\nN:${member.lastName};${
    member.firstName
  };${member.middleName?.trim() !== '' ? member.middleName + ';' : ''}${
    !!member.currentTitle ? member.currentTitle + ';' : ''
  }\nFN:${member.nameWithTitle}\nORG:FLC ${
    member?.bacenta?.council.name
  } Council;${
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

  return vCard
}

const returnStringMemberRoles = (memberLeader: any, memberAdmin: any) => {
  const rank = getRank(memberLeader, memberAdmin)
  const arrayOfRoles: string[] = []

  Object.entries(rank).map((rank: any) => {
    if (rank[1].length > 0) {
      const place = {
        name: rank[1][0].name,
        __typename: rank[1][0].__typename,
        admin: rank[1][0].admin,
        link: rank[1][0].link,
      }
      const servant = place.admin ? 'Admin' : 'Leader'
      arrayOfRoles.push(`${place.__typename} ${servant}: ${place.name}`)
    }
    return rank
  })

  return arrayOfRoles.join('\\n')
}

type InfoRowProps = {
  label: string
  value?: string | null
  loading?: boolean
}

const InfoRow = ({ label, value, loading }: InfoRowProps) => {
  if (loading) {
    return (
      <div className="py-3 border-b border-border last:border-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <Skeleton className="h-5 w-40" />
      </div>
    )
  }
  if (!value) return null

  return (
    <div className="py-3 border-b border-border last:border-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

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
  const errorToThrow: any = error
  throwToSentry(errorToThrow)

  const member: Member = bioData?.members[0]
  const memberChurch = churchData?.members[0]
  const memberLeader = leaderData?.members[0]
  const memberAdmin = adminData?.members[0]
  const memberBirthday = getMemberDob(member)
  const roles = returnStringMemberRoles(memberLeader, memberAdmin)

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
    } finally {
      handleClose()
    }
  }

  const initials = member
    ? `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`
    : ''

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
                <div className="py-4 space-y-2">
                  <p className="text-sm text-[hsl(var(--arrivals))]">
                    This note will be visible to all Admins and Leaders
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can put Room Number, Special Instructions etc
                  </p>
                  <Textarea name="note" label="Note" />
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

      {/* Top action bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <RoleView
          roles={[
            ...permitAdmin('Governorship'),
            ...permitAdmin('Ministry'),
            ...permitLeader('Bacenta'),
          ]}
        >
          <EditButton link="/member/editmember" />
        </RoleView>

        <RoleView roles={['all']} verifyNotId={member?.id}>
          <Button size="sm" variant="outline" onClick={handleShow}>
            <StickyNote className="h-3.5 w-3.5 mr-1.5" />
            Add Sticky Note
          </Button>
        </RoleView>
      </div>

      <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
        {/* Profile photo */}
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <Skeleton className="h-28 w-28 rounded-full" />
          ) : (
            <Avatar className="h-28 w-28">
              <AvatarImage
                src={member?.pictureUrl || USER_PLACEHOLDER}
                alt={member?.fullName}
              />
              <AvatarFallback className="text-2xl font-semibold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Name + save contact */}
          {loading ? (
            <div className="space-y-2 text-center">
              <Skeleton className="h-6 w-48 mx-auto" />
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <h2 className="text-xl font-semibold text-foreground">
                  {member?.nameWithTitle}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
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
                  }}
                >
                  <Save className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Roles */}
              {(adminLoading || leaderLoading) && (
                <div className="flex justify-center mt-1">
                  <BarLoader color="gray" width={120} />
                </div>
              )}
              {!adminLoading && !leaderLoading && (
                <MemberRoleList
                  memberLeader={memberLeader}
                  memberAdmin={memberAdmin}
                />
              )}
            </div>
          )}
        </div>

        {/* Sticky note */}
        {member?.stickyNote && member?.stickyNote?.trim() !== '' && (
          <div className="rounded-lg border border-warning/50 bg-warning/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <StickyNote className="h-4 w-4 text-[hsl(var(--warning))]" />
              <span className="text-sm font-medium text-[hsl(var(--warning))]">
                Sticky Note
              </span>
            </div>
            <p className="text-sm text-foreground">{member?.stickyNote}</p>
          </div>
        )}

        {/* Personal info */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4">
            {loading ? (
              <div className="py-3 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="py-3 border-b border-border last:border-0">
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2">
                  <InfoRow label="First Name" value={member?.firstName} />
                  <InfoRow label="Last Name" value={member?.lastName} />
                </div>
                {member?.middleName && (
                  <InfoRow label="Middle Name" value={member?.middleName} />
                )}
                <div className="grid grid-cols-2">
                  <InfoRow label="Gender" value={member?.gender?.gender} />
                  <InfoRow
                    label="Marital Status"
                    value={member?.maritalStatus?.status}
                  />
                </div>
                <InfoRow label="Date of Birth" value={memberBirthday || ''} />
                {member?.occupation?.occupation && (
                  <InfoRow
                    label="Occupation"
                    value={member?.occupation?.occupation}
                  />
                )}
                {member?.email && (
                  <InfoRow label="Email Address" value={member?.email} />
                )}
                {member?.visitationArea && (
                  <InfoRow
                    label="Location for IDL"
                    value={member?.visitationArea.toString()}
                  />
                )}
                {member?.titleConnection?.edges[0]?.node.title && (
                  <InfoRow
                    label="Pastoral Rank"
                    value={member.currentTitle}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${member?.phoneNumber}`} className="block">
            <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 active:bg-muted transition-colors">
              <div className="h-9 w-9 rounded-full bg-[hsl(var(--arrivals)/0.1)] flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-[hsl(var(--arrivals))]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-mono font-medium truncate">
                  +{member?.phoneNumber}
                </p>
              </div>
            </div>
          </a>

          <a
            href={`https://wa.me/${member?.whatsappNumber}`}
            className="block"
          >
            <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 active:bg-muted transition-colors">
              <div className="h-9 w-9 rounded-full bg-[hsl(var(--banking)/0.1)] flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-[hsl(var(--banking))]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="text-sm font-mono font-medium truncate">
                  +{member?.whatsappNumber}
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Church info */}
        {memberChurch?.bacenta && (
          <div
            className="rounded-lg border border-border bg-card p-3 cursor-pointer active:bg-muted transition-colors"
            onClick={() => {
              clickCard(memberChurch?.bacenta)
              navigate('/bacenta/displaydetails')
            }}
          >
            <p className="text-xs text-muted-foreground mb-0.5">Bacenta</p>
            <p className="text-sm font-medium text-foreground">
              {memberChurch?.bacenta?.name}
            </p>
          </div>
        )}

        {memberChurch?.basonta && (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Basonta</p>
            <p className="text-sm font-medium text-foreground">
              {memberChurch?.basonta?.name}
            </p>
          </div>
        )}

        {/* Church history */}
        <div>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Church History
            </h3>
            <ViewAll to="/member/history" />
          </div>
          <Timeline record={memberChurch?.history} limit={3} />
        </div>
      </div>
    </div>
  )
}

export default MemberDisplay
