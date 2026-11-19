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
import SearchGovernorship from 'components/formik/SearchGovernorship'
import SearchCouncil from 'components/formik/SearchCouncil'
import SearchStream from 'components/formik/SearchStream'
import SearchCampus from 'components/formik/SearchCampus'
import {
  MOVE_BACENTA_TO_GOVERNORSHIP,
  MOVE_COUNCIL_TO_STREAM,
  MOVE_GOVERNORSHIP_TO_COUNCIL,
  MOVE_STREAM_TO_CAMPUS,
} from 'pages/directory/update/UpdateMutations'
import { throwToSentry } from 'global-utils'
import { displayError, isPermissionError } from 'utils/errorHandler'
import type { ChurchLevel } from 'global-types'

export type TransferableLevel = Extract<
  ChurchLevel,
  'Bacenta' | 'Governorship' | 'Council' | 'Stream'
>

type TransferChurchSheetProps = {
  open: boolean
  onClose: () => void
  churchId: string
  churchName: string
  churchLevel: TransferableLevel
  oldParentId: string
}

type FormValues = {
  destination: { id: string; name: string } | null
}

const parentLabel: Record<TransferableLevel, string> = {
  Bacenta: 'Governorship',
  Governorship: 'Council',
  Council: 'Stream',
  Stream: 'Campus',
}

const transferColor: Record<TransferableLevel, string> = {
  Bacenta: 'text-violet-500',
  Governorship: 'text-blue-500',
  Council: 'text-amber-500',
  Stream: 'text-green-500',
}

const TransferChurchSheet = ({
  open,
  onClose,
  churchId,
  churchName,
  churchLevel,
  oldParentId,
}: TransferChurchSheetProps) => {
  const [MoveBacentaToGovernorship] = useMutation(MOVE_BACENTA_TO_GOVERNORSHIP)
  const [MoveGovernorshipToCouncil] = useMutation(MOVE_GOVERNORSHIP_TO_COUNCIL)
  const [MoveCouncilToStream] = useMutation(MOVE_COUNCIL_TO_STREAM)
  const [MoveStreamToCampus] = useMutation(MOVE_STREAM_TO_CAMPUS)

  const targetLabel = parentLabel[churchLevel]
  const colorClass = transferColor[churchLevel]

  const initialValues: FormValues = { destination: null }

  const validationSchema = Yup.object({
    destination: Yup.object({
      id: Yup.string().required(`Please select a ${targetLabel}`),
    })
      .nullable()
      .required(`Please select a ${targetLabel}`),
  })

  const onSubmit = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    if (!values.destination?.id) return
    const dest = values.destination
    try {
      if (churchLevel === 'Bacenta') {
        await MoveBacentaToGovernorship({
          variables: {
            bacentaId: churchId,
            newGovernorshipId: dest.id,
            oldGovernorshipId: oldParentId,
            historyRecord: `${churchName} Bacenta moved to ${dest.name} Governorship`,
          },
          refetchQueries: 'active',
        })
      } else if (churchLevel === 'Governorship') {
        await MoveGovernorshipToCouncil({
          variables: {
            governorshipId: churchId,
            newCouncilId: dest.id,
            oldCouncilId: oldParentId,
            historyRecord: `${churchName} Governorship moved to ${dest.name} Council`,
          },
          refetchQueries: 'active',
        })
      } else if (churchLevel === 'Council') {
        await MoveCouncilToStream({
          variables: {
            councilId: churchId,
            newStreamId: dest.id,
            oldStreamId: oldParentId,
            historyRecord: `${churchName} Council moved to ${dest.name} Stream`,
          },
          refetchQueries: 'active',
        })
      } else if (churchLevel === 'Stream') {
        await MoveStreamToCampus({
          variables: {
            streamId: churchId,
            newCampusId: dest.id,
            oldCampusId: oldParentId,
            historyRecord: `${churchName} Stream moved to ${dest.name} Campus`,
          },
          refetchQueries: 'active',
        })
      }
      onClose()
    } catch (e) {
      if (!isPermissionError(e)) {
        throwToSentry(`Error transferring ${churchLevel}`, e)
      }
      displayError(`Could not transfer ${churchLevel}`, e)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  const searchProps = {
    name: 'destination',
    label: `New ${targetLabel}`,
    placeholder: `Search for a ${targetLabel}...`,
    initialValue: '',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Transfer{' '}
            <span className={colorClass}>{churchLevel}</span>
          </DialogTitle>
          <DialogDescription>
            Moving <strong>{churchName}</strong> to a new {targetLabel}
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
              {churchLevel === 'Council' && (
                <SearchStream
                  {...searchProps}
                  setFieldValue={formik.setFieldValue}
                  error={
                    formik.touched.destination
                      ? (formik.errors.destination as string | undefined)
                      : undefined
                  }
                />
              )}
              {churchLevel === 'Stream' && (
                <SearchCampus
                  {...searchProps}
                  setFieldValue={formik.setFieldValue}
                  error={
                    formik.touched.destination
                      ? (formik.errors.destination as string | undefined)
                      : undefined
                  }
                />
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

export default TransferChurchSheet
