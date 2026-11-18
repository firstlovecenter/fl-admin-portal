import React from 'react'
import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Button } from 'components/ui/button'
import SubmitButton from 'components/formik/SubmitButton'
import SearchBacenta from 'components/formik/SearchBacenta'
import { UPDATE_MEMBER_BACENTA } from 'pages/directory/update/UpdateMutations'
import { throwToSentry } from 'global-utils'
import { displayError, isPermissionError } from 'utils/errorHandler'

type TransferMemberSheetProps = {
  open: boolean
  onClose: () => void
  memberId: string
  memberName: string
  currentBacentaId: string
  currentBacentaName: string
}

type FormValues = {
  bacenta: { id: string; name: string } | null
}

const TransferMemberSheet = ({
  open,
  onClose,
  memberId,
  memberName,
  currentBacentaId,
  currentBacentaName,
}: TransferMemberSheetProps) => {
  const [UpdateMemberBacenta] = useMutation(UPDATE_MEMBER_BACENTA)

  const initialValues: FormValues = { bacenta: null }

  const validationSchema = Yup.object({
    bacenta: Yup.object({
      id: Yup.string().required('Please select a bacenta'),
    })
      .nullable()
      .required('Please select a bacenta'),
  })

  const onSubmit = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    if (!values.bacenta?.id) return
    try {
      await UpdateMemberBacenta({
        variables: {
          memberId,
          bacentaId: values.bacenta.id,
          ids: [memberId, values.bacenta.id, currentBacentaId],
          historyRecord: `${memberName} moved from ${currentBacentaName} Bacenta to ${values.bacenta.name} Bacenta`,
        },
        refetchQueries: 'active',
      })
      onClose()
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry('Error transferring member', e)
      }
      displayError('Could not transfer member', e)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Member</DialogTitle>
          <DialogDescription>
            Moving <strong>{memberName}</strong> from{' '}
            <strong>{currentBacentaName}</strong> Bacenta
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {(formik) => (
            <Form className="space-y-4">
              <SearchBacenta
                name="bacenta"
                label="New Bacenta"
                placeholder="Search for a bacenta..."
                setFieldValue={formik.setFieldValue}
                error={
                  formik.touched.bacenta
                    ? (formik.errors.bacenta as string | undefined)
                    : undefined
                }
                initialValue=""
              />

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={formik.isSubmitting}
                >
                  Cancel
                </Button>
                <SubmitButton
                  formik={formik}
                  disabled={!formik.values.bacenta?.id}
                >
                  Transfer
                </SubmitButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  )
}

export default TransferMemberSheet
