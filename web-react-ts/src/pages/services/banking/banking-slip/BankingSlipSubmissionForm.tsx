import { DocumentNode, useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import ImageUpload from 'components/formik/ImageUpload'
import SubmitButton from 'components/formik/SubmitButton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { MemberContext } from 'contexts/MemberContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { Form, Formik, FormikHelpers } from 'formik'
import useModal from 'hooks/useModal'
import usePopup from 'hooks/usePopup'
import { getHumanReadableDate } from 'lib/date-utils'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import { BANKING_SLIP_SUBMISSION } from '../../ServicesQueries'

type ServiceRecord = {
  cash?: number | null
  serviceDate: { date: string }
}

type ServiceRecordsResponse = {
  serviceRecords: Array<
    ServiceRecord & {
      serviceLog?: Record<string, Array<{ name: string }>>
    }
  >
}

type FormOptions = {
  bankingSlip: string
}

type BankingSlipSubmissionFormProps = {
  query: DocumentNode
  selectChurchFromData: (data: ServiceRecordsResponse | undefined) =>
    | { name: string }
    | undefined
  serviceDateLabel: string
  successPath: string
  errorListPath: string
}

const messageFromError = (err: unknown): string => {
  if (err instanceof Error) return err.message
  return String(err)
}

const BankingSlipSubmissionForm = ({
  query,
  selectChurchFromData,
  serviceDateLabel,
  successPath,
  errorListPath,
}: BankingSlipSubmissionFormProps) => {
  const { t } = useTranslation()
  const { serviceRecordId } = useContext(ServiceContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()
  const { togglePopup, isOpen } = usePopup()
  const { show: confirmOpen, handleShow: openConfirm, handleClose: closeConfirm } = useModal()
  const [errorMessage, setErrorMessage] = useState('')
  const currency = currentUser.currency

  const { data, loading, error } = useQuery<ServiceRecordsResponse>(query, {
    variables: { serviceId: serviceRecordId },
  })
  const church = selectChurchFromData(data)
  const serviceRecord = data?.serviceRecords[0]

  const initialValues: FormOptions = { bankingSlip: '' }
  const [SubmitBankingSlip] = useMutation(BANKING_SLIP_SUBMISSION)

  const validationSchema = Yup.object({
    bankingSlip: Yup.string().required(
      t('services.banking.bankingSlip.slipRequired')
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await SubmitBankingSlip({
        variables: {
          serviceRecordId,
          bankingSlip: values.bankingSlip,
        },
      })
      onSubmitProps.resetForm()
      navigate(successPath)
    } catch (err: unknown) {
      setErrorMessage(messageFromError(err))
      togglePopup()
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) togglePopup()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('services.banking.bankingSlip.submissionFailed')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('services.banking.bankingSlip.submissionFailedBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <code className="block break-words rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {errorMessage}
          </code>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                togglePopup()
                navigate(errorListPath)
              }}
            >
              {t('shared.actions.okay')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StickyPageHeader>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('services.banking.bankingSlip.submissionTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">{church?.name}</p>
      </StickyPageHeader>

      <ApolloWrapper loading={loading} error={error} data={data && church}>
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
          <Card>
            <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  {serviceDateLabel}:
                </span>{' '}
                {serviceRecord
                  ? getHumanReadableDate(serviceRecord.serviceDate.date, true)
                  : ''}
              </p>
              <p>
                <span className="font-medium text-foreground">
                  {t('services.banking.bankingSlip.expectedIncome')}
                </span>{' '}
                <span className="font-mono tabular-nums">
                  {serviceRecord?.cash ?? '—'} {currency}
                </span>
              </p>
            </CardContent>
          </Card>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            validateOnMount
          >
            {(formik) => (
              <Form className="space-y-4">
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <ImageUpload
                      label={t('services.banking.bankingSlip.uploadLabel')}
                      name="bankingSlip"
                      placeholder={t('services.banking.bankingSlip.choose')}
                      setFieldValue={formik.setFieldValue}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="button"
                  className="w-full"
                  disabled={!formik.isValid || formik.isSubmitting}
                  onClick={openConfirm}
                >
                  {t('services.form.reviewAndSubmit')}
                </Button>

                {/* ── Confirmation dialog ── */}
                <Dialog
                  open={confirmOpen}
                  onOpenChange={(open) => !open && closeConfirm()}
                >
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>
                        {t('services.form.confirmTitle')}
                      </DialogTitle>
                      <DialogDescription>
                        {t('shared.confirmDialog.reviewDetails')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-1 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          {t('services.form.church')}
                        </span>
                        <span className="font-medium text-foreground">
                          {church?.name}
                        </span>
                      </div>
                      {serviceRecord && (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {serviceDateLabel}
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {getHumanReadableDate(
                                serviceRecord.serviceDate.date,
                                true
                              )}
                            </span>
                          </div>
                          {serviceRecord.cash != null && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">
                                {t(
                                  'services.banking.bankingSlip.expectedIncome'
                                )}
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {serviceRecord.cash} {currency}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={closeConfirm}>
                        {t('shared.actions.edit')}
                      </Button>
                      <SubmitButton
                        onClick={() => {
                          closeConfirm()
                          formik.handleSubmit()
                        }}
                        formik={formik}
                      />
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Form>
            )}
          </Formik>
        </div>
      </ApolloWrapper>
    </div>
  )
}

export default BankingSlipSubmissionForm
