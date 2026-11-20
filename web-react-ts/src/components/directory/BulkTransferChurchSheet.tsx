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
import SearchGovernorship from 'components/formik/SearchGovernorship'
import SearchCouncil from 'components/formik/SearchCouncil'
import {
  MOVE_BACENTA_TO_GOVERNORSHIP,
  MOVE_GOVERNORSHIP_TO_COUNCIL,
} from 'pages/directory/update/UpdateMutations'
import { throwToSentry } from 'global-utils'
import { displayError, isPermissionError } from 'utils/errorHandler'
import type { TransferableLevel } from './TransferChurchSheet'

type BulkTransferChurchSheetProps = {
  open: boolean
  onClose: () => void
  churchIds: string[]
  churchNames: string[]
  churchLevel: Extract<TransferableLevel, 'Bacenta' | 'Governorship'>
  oldParentId: string
  onSuccess?: () => void
}

type FormValues = {
  destination: { id: string; name: string } | null
}

const targetLabel: Record<'Bacenta' | 'Governorship', string> = {
  Bacenta: 'Governorship',
  Governorship: 'Council',
}

const BulkTransferChurchSheet = ({
  open,
  onClose,
  churchIds,
  churchNames,
  churchLevel,
  oldParentId,
  onSuccess,
}: BulkTransferChurchSheetProps) => {
  const [progress, setProgress] = useState(0)

  const [MoveBacentaToGovernorship] = useMutation(MOVE_BACENTA_TO_GOVERNORSHIP)
  const [MoveGovernorshipToCouncil] = useMutation(MOVE_GOVERNORSHIP_TO_COUNCIL)

  const destinationLabel = targetLabel[churchLevel]
  const initialValues: FormValues = { destination: null }

  const validationSchema = Yup.object({
    destination: Yup.object({
      id: Yup.string().required(`Please select a ${destinationLabel}`),
    })
      .nullable()
      .required(`Please select a ${destinationLabel}`),
  })

  const onSubmit = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    if (!values.destination?.id) return
    const dest = values.destination
    setProgress(0)
    try {
      for (let i = 0; i < churchIds.length; i++) {
        const churchId = churchIds[i]
        const churchName = churchNames[i] ?? churchId

        if (churchLevel === 'Bacenta') {
          await MoveBacentaToGovernorship({
            variables: {
              bacentaId: churchId,
              newGovernorshipId: dest.id,
              oldGovernorshipId: oldParentId,
              historyRecord: `${churchName} Bacenta moved to ${dest.name} Governorship (bulk transfer)`,
            },
          })
        } else {
          await MoveGovernorshipToCouncil({
            variables: {
              governorshipId: churchId,
              newCouncilId: dest.id,
              oldCouncilId: oldParentId,
              historyRecord: `${churchName} Governorship moved to ${dest.name} Council (bulk transfer)`,
            },
          })
        }
        setProgress(i + 1)
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry(`Error bulk transferring ${churchLevel}s`, e)
      }
      displayError(`Could not complete bulk ${churchLevel} transfer`, e)
    } finally {
      helpers.setSubmitting(false)
      setProgress(0)
    }
  }

  const searchProps = {
    name: 'destination',
    label: `New ${destinationLabel}`,
    placeholder: `Search for a ${destinationLabel}...`,
    initialValue: '',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Transfer {churchIds.length} {churchLevel}
            {churchIds.length !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            All selected {churchLevel.toLowerCase()}s will be moved to the same{' '}
            {destinationLabel}.
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
              {churchLevel === 'Bacenta' && (
                <SearchGovernorship
                  {...searchProps}
                  setFieldValue={formik.setFieldValue}
                  error={
                    formik.touched.destination
                      ? (formik.errors.destination as string | undefined)
                      : undefined
                  }
                />
              )}
              {churchLevel === 'Governorship' && (
                <SearchCouncil
                  {...searchProps}
                  setFieldValue={formik.setFieldValue}
                  error={
                    formik.touched.destination
                      ? (formik.errors.destination as string | undefined)
                      : undefined
                  }
                />
              )}

              {formik.isSubmitting && progress > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Transferring {progress}/{churchIds.length}...
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
                  disabled={!formik.values.destination?.id}
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

export default BulkTransferChurchSheet
