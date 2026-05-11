import { useContext } from 'react'
import { useMutation } from '@apollo/client'
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  alertMsg,
  DELETE_MEMBER_CATEGORY_OPTIONS,
  throwToSentry,
} from 'global-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { Button } from 'components/ui/button'
import { Label } from 'components/ui/label'
import { Textarea } from 'components/ui/textarea'
import { RadioGroup, RadioGroupItem } from 'components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { MAKE_MEMBER_INACTIVE } from '../update/UpdateMutations'

type DeleteMemberValues = {
  reason: string
  reasonCategory: string
}

type MemberDeleteDialogProps = {
  open: boolean
  onClose: () => void
  memberFirstName: string
  memberLastName: string
  bacentaId?: string
}

const validationSchema = Yup.object({
  reasonCategory: Yup.string().required('Please pick a reason category'),
  reason: Yup.string().required(
    "Please provide the reason you're deleting this member"
  ),
})

const MemberDeleteDialog = ({
  open,
  onClose,
  memberFirstName,
  memberLastName,
  bacentaId,
}: MemberDeleteDialogProps) => {
  const { memberId } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const [MakeMemberInactive] = useMutation(MAKE_MEMBER_INACTIVE)

  const onDelete = async (
    values: DeleteMemberValues,
    helpers: FormikHelpers<DeleteMemberValues>
  ) => {
    helpers.setSubmitting(true)
    try {
      await MakeMemberInactive({
        variables: {
          memberId,
          reason: `${memberFirstName} ${memberLastName} was deleted: ${values.reasonCategory} - ${values.reason}`,
        },
      })

      onClose()
      alertMsg('Member has been deleted successfully')
      if (bacentaId) {
        clickCard({ __typename: 'Bacenta', id: bacentaId })
        navigate('/bacenta/displaydetails')
      } else {
        navigate('/directory')
      }
    } catch (e) {
      throwToSentry('Cannot delete member', e)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this member?</DialogTitle>
          <DialogDescription>
            This will mark the member as inactive. Please tell us why
            you&apos;re deleting them — this is recorded in their history.
          </DialogDescription>
        </DialogHeader>
        <Formik
          initialValues={{ reason: '', reasonCategory: '' }}
          validationSchema={validationSchema}
          onSubmit={onDelete}
        >
          {(formik) => (
            <Form className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Reason category <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formik.values.reasonCategory}
                  onValueChange={(v) =>
                    formik.setFieldValue('reasonCategory', v)
                  }
                  className="gap-2"
                >
                  {DELETE_MEMBER_CATEGORY_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      htmlFor={`reason-${o.value}`}
                      className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer min-h-[44px]"
                    >
                      <RadioGroupItem
                        value={o.value}
                        id={`reason-${o.value}`}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-foreground leading-snug">
                        {o.key}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <ErrorMessage name="reasonCategory">
                  {(msg) => (
                    <p className="text-xs text-destructive" role="alert">
                      {msg}
                    </p>
                  )}
                </ErrorMessage>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">
                  Additional details <span className="text-destructive">*</span>
                </Label>
                <Field
                  as={Textarea}
                  id="reason"
                  name="reason"
                  rows={3}
                  placeholder="Add any context that helps explain this decision"
                />
                <ErrorMessage name="reason">
                  {(msg) => (
                    <p className="text-xs text-destructive" role="alert">
                      {msg}
                    </p>
                  )}
                </ErrorMessage>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={formik.isSubmitting}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={formik.isSubmitting}
                  className="min-h-[44px] gap-2"
                >
                  {formik.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    'Delete Member'
                  )}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  )
}

export default MemberDeleteDialog
