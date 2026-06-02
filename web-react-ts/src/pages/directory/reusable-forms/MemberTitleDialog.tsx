import { useContext, useState } from 'react'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQuery } from '@apollo/client'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { throwToSentry } from 'global-utils'
import { MemberContext } from 'contexts/MemberContext'
import Input from 'components/formik/Input'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import {
  GET_MEMBER_TITLES,
  REMOVE_MEMBER_TITLE,
  UPDATE_MEMBER_APPOINTMENT_DATE,
  UPDATE_MEMBER_CONSECRATION_DATE,
  UPDATE_MEMBER_ORDINATION_DATE,
} from './MemberTitleGQL'

interface MemberTitleRelationship {
  properties: {
    date: string
  }
  node: {
    name: string
  }
}

interface Member {
  id: string
  firstName: string
  lastName: string
  fullName?: string
  nameWithTitle?: string
  titleConnection: {
    edges: MemberTitleRelationship[]
  }
}

interface Data {
  members: Member[]
}

type TitleKey = 'Pastor' | 'Reverend' | 'Bishop'

const parseData = (data?: Data) => {
  const result = { Pastor: '', Reverend: '', Bishop: '' } as Record<
    TitleKey,
    string
  >

  data?.members[0]?.titleConnection.edges.forEach((edge) => {
    const name = edge.node.name as TitleKey
    if (name in result) result[name] = edge.properties.date
  })

  return result
}

type MemberTitleDialogProps = {
  open: boolean
  onClose: () => void
}

const MemberTitleDialog = ({ open, onClose }: MemberTitleDialogProps) => {
  const { memberId } = useContext(MemberContext)
  const { data, loading } = useQuery<Data>(GET_MEMBER_TITLES, {
    variables: { id: memberId },
    skip: !open || !memberId,
  })

  const [UpdateMemberAppointmentDate] = useMutation(
    UPDATE_MEMBER_APPOINTMENT_DATE
  )
  const [UpdateMemberOrdinationDate] = useMutation(
    UPDATE_MEMBER_ORDINATION_DATE
  )
  const [UpdateMemberConsecrationDate] = useMutation(
    UPDATE_MEMBER_CONSECRATION_DATE
  )
  const [RemoveMemberTitle] = useMutation(REMOVE_MEMBER_TITLE)
  const [removingTitle, setRemovingTitle] = useState<TitleKey | null>(null)

  const member = data?.members[0]
  const saved = parseData(data)

  const initialValues = {
    appointmentDate: saved.Pastor,
    ordinationDate: saved.Reverend,
    consecrationDate: saved.Bishop,
  }

  const validationSchema = Yup.object({
    appointmentDate: Yup.string(),
    ordinationDate: Yup.string(),
    consecrationDate: Yup.string(),
  })

  const onSubmit = async (
    values: typeof initialValues,
    helpers: FormikHelpers<typeof initialValues>
  ) => {
    // Sequential — each mutation rewrites the member's titleConnection in the
    // Apollo cache, so running them in parallel would race and the last
    // response would clobber the others' edges.
    // Empty values are intentional no-ops: to clear a title, use the per-row
    // Remove button (RemoveMemberTitle), not the date input.
    try {
      if (values.appointmentDate && values.appointmentDate !== saved.Pastor) {
        await UpdateMemberAppointmentDate({
          variables: { id: memberId, appointmentDate: values.appointmentDate },
        })
      }
      if (values.ordinationDate && values.ordinationDate !== saved.Reverend) {
        await UpdateMemberOrdinationDate({
          variables: { id: memberId, ordinationDate: values.ordinationDate },
        })
      }
      if (
        values.consecrationDate &&
        values.consecrationDate !== saved.Bishop
      ) {
        await UpdateMemberConsecrationDate({
          variables: {
            id: memberId,
            consecrationDate: values.consecrationDate,
          },
        })
      }
      toast.success('Pastoral titles updated')
      onClose()
    } catch (err) {
      throwToSentry('Error Updating Member Title', err)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  const onRemove = async (title: TitleKey) => {
    setRemovingTitle(title)
    try {
      await RemoveMemberTitle({ variables: { id: memberId, title } })
      toast.success(`${title} title removed`)
    } catch (err) {
      throwToSentry(`Error removing ${title} title`, err)
    } finally {
      setRemovingTitle(null)
    }
  }

  const fields: Array<{
    name: keyof typeof initialValues
    label: string
    title: TitleKey
  }> = [
    {
      name: 'appointmentDate',
      label: 'Pastoral Appointment Date',
      title: 'Pastor',
    },
    {
      name: 'ordinationDate',
      label: 'Ordination Date',
      title: 'Reverend',
    },
    {
      name: 'consecrationDate',
      label: 'Consecration Date',
      title: 'Bishop',
    },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !removingTitle) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pastoral Titles</DialogTitle>
          <DialogDescription>
            {member?.fullName
              ? `Set or update pastoral title dates for ${member.fullName}.`
              : 'Set or update pastoral title dates for this member.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
          >
            {(formik) => (
              <Form className="space-y-4">
                {fields.map(({ name, label, title }) => {
                  const isRemoving = removingTitle === title
                  const hasSaved = Boolean(saved[title])
                  return (
                    <div key={name}>
                      <Input name={name} label={label} type="date" />
                      {hasSaved && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(title)}
                          disabled={isRemoving || formik.isSubmitting}
                          className="mt-1 h-7 gap-1 px-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {isRemoving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Remove {title} title
                        </Button>
                      )}
                    </div>
                  )
                })}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={formik.isSubmitting || Boolean(removingTitle)}
                    className="min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formik.isSubmitting || Boolean(removingTitle)}
                    className="min-h-[44px] gap-2"
                  >
                    {formik.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default MemberTitleDialog
