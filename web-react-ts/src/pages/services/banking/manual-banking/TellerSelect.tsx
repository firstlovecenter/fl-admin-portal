import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FunctionReturnsVoid, Member, Stream } from 'global-types'
import React, { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { alertSuccess, throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import SearchMember from 'components/formik/SearchMember'
import { Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'
import ModalSubmitButton from './ModalSubmitButton'
import {
  MAKE_STREAM_TELLER,
  REMOVE_STREAM_TELLER,
  STREAM_BANK_TELLERS,
} from './Treasury.gql'
import './TellerSelect.css'

interface StreamWithTellers extends Stream {
  tellers: Member[]
  activeBacentaCount: number
}

type FormOptions = {
  tellerName: string
  tellerSelect: string
}

const TellerSelect = () => {
  const { t } = useTranslation()
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(STREAM_BANK_TELLERS, {
    variables: { id: streamId },
  })
  const [submitting, setSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const [tellerToDelete, setTellerToDelete] = useState<Member | null>(null)
  const handleOpen: FunctionReturnsVoid = () => setShow(true)
  const handleClose: FunctionReturnsVoid = () => setShow(false)

  const stream: StreamWithTellers = data?.streams[0]

  const [MakeStreamTeller] = useMutation(MAKE_STREAM_TELLER, {
    refetchQueries: [
      {
        query: STREAM_BANK_TELLERS,
        variables: { id: streamId },
      },
    ],
  })

  const [RemoveStreamTeller] = useMutation(REMOVE_STREAM_TELLER, {
    refetchQueries: [
      {
        query: STREAM_BANK_TELLERS,
        variables: { id: streamId },
      },
    ],
  })

  const confirmDeleteTeller = async () => {
    if (!tellerToDelete) return
    const teller = tellerToDelete
    setSubmitting(true)
    try {
      await RemoveStreamTeller({
        variables: {
          streamId,
          tellerId: teller.id,
        },
      })
      alertSuccess(
        t('services.banking.tellerSelect.deletedSuccess', {
          name: teller.fullName,
        })
      )
    } catch (error: any) {
      throwToSentry('', error)
    } finally {
      setSubmitting(false)
      setTellerToDelete(null)
    }
  }

  const initialValues: FormOptions = {
    tellerName: '',
    tellerSelect: '',
  }

  const validationSchema = useMemo(
    () =>
      Yup.object({
        tellerSelect: Yup.string().required(
          t('services.banking.tellerSelect.tellerRequired')
        ),
      }),
    [t]
  )

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      const { errors } = await MakeStreamTeller({
        variables: {
          streamId,
          tellerId: values.tellerSelect,
        },
      })

      if (errors?.length) {
        throw new Error(errors[0].message)
      }

      handleClose()
      alertSuccess(t('services.banking.tellerSelect.addedSuccess'))
    } catch (e: unknown) {
      throwToSentry('There was an error adding the teller', e)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>
          {t('services.banking.tellerSelect.selectTellers', {
            name: stream?.name ?? '',
          })}
        </HeadingPrimary>
        <HeadingSecondary>
          {t('services.banking.tellerSelect.useButtons')}
        </HeadingSecondary>
        <div>
          {t('services.banking.tellerSelect.activeBacentas', {
            count: stream?.activeBacentaCount ?? 0,
          })}
        </div>

        <Dialog
          open={show}
          onOpenChange={(open) => (open ? handleOpen() : handleClose())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('services.banking.tellerSelect.chooseTreasurer')}
              </DialogTitle>
            </DialogHeader>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {(formik) => (
                <Form>
                  <div className="space-y-3">
                    <SearchMember
                      name="tellerSelect"
                      initialValue={initialValues?.tellerName}
                      placeholder={t('services.banking.tellerSelect.selectAName')}
                      setFieldValue={formik.setFieldValue}
                      aria-describedby="Member Search"
                      error={formik.errors.tellerSelect}
                    />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      {t('services.banking.tellerSelect.close')}
                    </Button>
                    <ModalSubmitButton formik={formik} />
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>

        <div className="mt-5 grid gap-2">
          <Button
            size="lg"
            onClick={handleOpen}
            className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
          >
            {t('services.banking.tellerSelect.chooseTreasurers')}
          </Button>
        </div>

        {stream?.tellers?.map((teller: Member) => (
          <div key={teller.id} className="space-y-2">
            <MemberDisplayCard member={teller} />
            <div className="grid gap-2">
              <Button
                disabled={submitting}
                variant="destructive"
                onClick={() => setTellerToDelete(teller)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('shared.form.submitting')}</span>
                  </>
                ) : (
                  t('services.banking.tellerSelect.delete')
                )}
              </Button>
            </div>
          </div>
        ))}

        {!stream?.tellers?.length && (
          <NoDataComponent text={t('services.banking.tellerSelect.noTellers')} />
        )}

        <AlertDialog
          open={tellerToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !submitting) setTellerToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('services.banking.tellerSelect.removeTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {tellerToDelete
                  ? t('services.banking.tellerSelect.removeBody', {
                      name: tellerToDelete.fullName,
                    })
                  : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting} className="min-h-11">
                {t('shared.actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={submitting}
                onClick={(event) => {
                  event.preventDefault()
                  confirmDeleteTeller()
                }}
                className="min-h-11 bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              >
                {submitting
                  ? t('services.banking.tellerSelect.deleting')
                  : t('services.banking.tellerSelect.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ApolloWrapper>
  )
}

export default TellerSelect
