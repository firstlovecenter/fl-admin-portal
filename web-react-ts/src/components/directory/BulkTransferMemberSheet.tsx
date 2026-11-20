import React, { useState } from 'react'
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

type BulkTransferMemberSheetProps = {
  open: boolean
  onClose: () => void
  memberIds: string[]
  onSuccess?: () => void
}

type FormValues = {
  bacenta: { id: string; name: string } | null
}

const BulkTransferMemberSheet = ({
  open,
  onClose,
  memberIds,
  onSuccess,
}: BulkTransferMemberSheetProps) => {
  const [progress, setProgress] = useState(0)

  const [UpdateMemberBacenta] = useMutation(UPDATE_MEMBER_BACENTA)

  const initialValues: FormValues = { bacenta: null }

  const validationSchema = Yup.object({
    bacenta: Yup.object({
      id: Yup.string().required('Please select a destination bacenta'),
    })
      .nullable()
      .required('Please select a destination bacenta'),
  })

  const onSubmit = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    if (!values.bacenta?.id) return
    setProgress(0)
    try {
      for (let i = 0; i < memberIds.length; i++) {
        const memberId = memberIds[i]
        await UpdateMemberBacenta({
          variables: {
            memberId,
            bacentaId: values.bacenta.id,
            ids: [memberId, values.bacenta.id],
            historyRecord: `Member moved to ${values.bacenta.name} Bacenta (bulk transfer)`,
          },
        })
        setProgress(i + 1)
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry('Error bulk transferring members', e)
      }
      displayError('Could not complete bulk transfer', e)
    } finally {
      helpers.setSubmitting(false)
      setProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Transfer {memberIds.length} Member{memberIds.length !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            All selected members will be moved to the same bacenta.
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
                label="Destination Bacenta"
                placeholder="Search for a bacenta..."
                setFieldValue={formik.setFieldValue}
                error={
                  formik.touched.bacenta
                    ? (formik.errors.bacenta as string | undefined)
                    : undefined
                }
                initialValue=""
              />

              {formik.isSubmitting && progress > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Transferring {progress}/{memberIds.length}...
                </p>
              )}

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
                  Transfer All
                </SubmitButton>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  )
}

export default BulkTransferMemberSheet
