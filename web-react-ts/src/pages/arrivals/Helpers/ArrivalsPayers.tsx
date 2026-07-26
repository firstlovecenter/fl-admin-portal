import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FunctionReturnsVoid, Member, Council } from 'global-types'
import { useTranslation } from 'react-i18next'
import React, { useContext, useState } from 'react'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { alertSuccess, throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import SearchMember from 'components/formik/SearchMember'
import ModalSubmitButton from 'pages/services/banking/manual-banking/ModalSubmitButton'
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
import {
  MAKE_COUNCIL_ARRIVALSPAYER,
  REMOVE_COUNCIL_ARRIVALSPAYER,
  COUNCIL_ARRIVALSPAYERS,
} from './ArrivalsHelpersGQL'
import './ArrivalsHelpers.css'

interface CouncilWithArrivalsPayers extends Council {
  arrivalsPayers: Member[]
  activeBacentaCount: number
}

type FormOptions = {
  arrivalsPayerName: string
  arrivalsPayerSelect: string
}

const ArrivalsPayerSelect = () => {
  const { t } = useTranslation()
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(COUNCIL_ARRIVALSPAYERS, {
    variables: { id: councilId },
  })
  const [submitting, setSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const [payerToDelete, setPayerToDelete] = useState<Member | null>(null)
  const handleOpen: FunctionReturnsVoid = () => setShow(true)
  const handleClose: FunctionReturnsVoid = () => setShow(false)

  const council: CouncilWithArrivalsPayers = data?.councils[0]

  const [MakeCouncilArrivalsPayer] = useMutation(MAKE_COUNCIL_ARRIVALSPAYER, {
    refetchQueries: [
      {
        query: COUNCIL_ARRIVALSPAYERS,
        variables: { id: councilId },
      },
    ],
  })

  const [RemoveCouncilArrivalsPayer] = useMutation(
    REMOVE_COUNCIL_ARRIVALSPAYER,
    {
      refetchQueries: [
        {
          query: COUNCIL_ARRIVALSPAYERS,
          variables: { id: councilId },
        },
      ],
    }
  )

  const confirmDeletePayer = async () => {
    if (!payerToDelete) return
    const payer = payerToDelete
    setSubmitting(true)
    try {
      await RemoveCouncilArrivalsPayer({
        variables: {
          councilId,
          arrivalsPayerId: payer.id,
        },
      })
      alertSuccess(t('arrivals.payers.deletedToast', { name: payer.fullName }))
    } catch (error: any) {
      throwToSentry('', error)
    } finally {
      setSubmitting(false)
      setPayerToDelete(null)
    }
  }

  const initialValues: FormOptions = {
    arrivalsPayerName: '',
    arrivalsPayerSelect: '',
  }

  const validationSchema = Yup.object({
    arrivalsPayerSelect: Yup.string().required(
      t('arrivals.payers.selectFromDropdown')
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      const { errors } = await MakeCouncilArrivalsPayer({
        variables: {
          councilId,
          arrivalsPayerId: values.arrivalsPayerSelect,
        },
      })

      if (errors?.length) {
        throw new Error(errors[0].message)
      }

      handleClose()
      alertSuccess(t('arrivals.payers.addedToast'))
    } catch (e: unknown) {
      throwToSentry(t('arrivals.payers.addError'), e)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>
          {t('arrivals.payers.selectCouncilMembers', {
            council: council?.name,
          })}
        </HeadingPrimary>
        <HeadingSecondary>
          {t('arrivals.payers.useButtonsBelow')}
        </HeadingSecondary>
        <div>
          {t('arrivals.payers.activeBacentaCount', {
            count: council?.activeBacentaCount,
          })}
        </div>

        <Dialog
          open={show}
          onOpenChange={(open) => (open ? handleOpen() : handleClose())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('arrivals.payers.chooseMember')}</DialogTitle>
            </DialogHeader>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {(formik) => (
                <Form>
                  <div className="form-row">
                    <SearchMember
                      name="arrivalsPayerSelect"
                      initialValue={initialValues?.arrivalsPayerName}
                      placeholder={t('arrivals.payers.selectAName')}
                      setFieldValue={formik.setFieldValue}
                      aria-describedby="Member Search"
                      error={formik.errors.arrivalsPayerSelect}
                    />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      {t('directory.common.close')}
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
            onClick={handleOpen}
            className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
          >
            {t('arrivals.payers.chooseMembers')}
          </Button>
        </div>

        {council?.arrivalsPayers?.map((arrivalsPayer: Member) => (
          <div key={arrivalsPayer.id} className="space-y-2">
            <MemberDisplayCard member={arrivalsPayer} />
            <div className="grid gap-2">
              <Button
                disabled={submitting}
                variant="destructive"
                onClick={() => setPayerToDelete(arrivalsPayer)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('shared.form.submitting')}</span>
                  </>
                ) : (
                  t('arrivals.payers.delete')
                )}
              </Button>
            </div>
          </div>
        ))}

        {!council?.arrivalsPayers?.length && (
          <NoDataComponent text={t('arrivals.payers.emptyList')} />
        )}

        <AlertDialog
          open={payerToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !submitting) setPayerToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('arrivals.payers.removeTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {payerToDelete
                  ? t('arrivals.payers.confirmDelete', {
                      name: payerToDelete.fullName,
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
                  confirmDeletePayer()
                }}
                className="min-h-11 bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
              >
                {submitting
                  ? t('arrivals.payers.deleting')
                  : t('arrivals.payers.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ApolloWrapper>
  )
}

export default ArrivalsPayerSelect
