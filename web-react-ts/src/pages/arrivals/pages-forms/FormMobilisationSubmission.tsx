import { Form, Formik, FormikHelpers } from 'formik'
import { useMutation, useQuery } from '@apollo/client'
import { useContext, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { Maximize2 } from 'lucide-react'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import SubmitButton from 'components/formik/SubmitButton'
import Input from 'components/formik/Input'
import ImageUpload from 'components/formik/ImageUpload'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { Skeleton } from 'components/ui/skeleton'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { displayError } from 'utils/errorHandler'
import { BACENTA_ARRIVALS } from '../arrivalsQueries'
import { UPLOAD_MOBILISATION_PICTURE } from '../arrivalsMutation'
import { beforeMobilisationDeadline } from '../arrivals-utils'
import { BacentaWithArrivals } from '../arrivals-types'
import { useTranslation } from 'react-i18next'

type FormOptions = {
  serviceDate: string
  mobilisationPicture: string
}

const FormMobilisationSubmission = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { bacentaId, clickCard } = useContext(ChurchContext)
  const [showCodeFullscreen, setShowCodeFullscreen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const initialValues: FormOptions = {
    serviceDate: today,
    mobilisationPicture: '',
  }

  const { data, loading, error } = useQuery(BACENTA_ARRIVALS, {
    variables: { id: bacentaId, date: today, bussingDate: today },
  })
  const [UploadMobilisationPicture] = useMutation(UPLOAD_MOBILISATION_PICTURE)

  const bacenta: BacentaWithArrivals | undefined = data?.bacentas[0]
  const codeOfTheDay = bacenta?.arrivalsCodeOfTheDay
  const bussing = bacenta?.bussingThisWeek

  const validationSchema = Yup.object({
    serviceDate: Yup.date()
      .max(new Date(), t('arrivals.form.serviceDateAfterToday'))
      .required(t('arrivals.form.dateRequired')),
    mobilisationPicture: Yup.string().required(t('arrivals.form.pictureRequired')),
  })

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    UploadMobilisationPicture({
      variables: {
        bacentaId,
        serviceDate: values.serviceDate,
        mobilisationPicture: values.mobilisationPicture,
      },
      refetchQueries: [
        {
          query: BACENTA_ARRIVALS,
          variables: { id: bacentaId, date: today, bussingDate: today },
        },
      ],
      awaitRefetchQueries: true,
    })
      .then((res) => {
        const result = res.data?.UploadMobilisationPicture
        if (!result) {
          displayError(t('arrivals.form.uploadFailed'), new Error('No result returned from server'))
          onSubmitProps.setSubmitting(false)
          return
        }
        clickCard(result)
        onSubmitProps.resetForm()
        onSubmitProps.setSubmitting(false)
        navigate(`/bacenta/bussing-details`)
      })
      .catch((err) => {
        displayError(t('arrivals.form.preMobilisationSubmissionFailed'), err)
        onSubmitProps.setSubmitting(false)
      })
  }

  useEffect(() => {
    if (!data) return
    if (!beforeMobilisationDeadline(bacenta, bussing)) {
      navigate('/arrivals/bacenta')
    }
  }, [bacenta, bussing, data, navigate])

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <StickyPageHeader>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {t('arrivals.common.preMobilisation')}{' '}
            <span className="text-arrivals">{t('arrivals.form.picture')}</span>
          </h1>
          {loading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('arrivals.bussing.bacentaName', { name: bacenta?.name })}
            </p>
          )}
        </StickyPageHeader>
        <main className="mx-auto w-full max-w-xl px-4 py-5 lg:px-6 lg:py-8">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="space-y-3 p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('arrivals.bacenta.codeOfDay')}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-mono text-3xl font-bold tabular-nums text-foreground dark:text-yellow-300">
                    {codeOfTheDay ?? '—'}
                  </p>
                  {codeOfTheDay && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={t('arrivals.bacenta.showCodeFullscreen')}
                      onClick={() => setShowCodeFullscreen(true)}
                    >
                      <Maximize2 className="size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
              validateOnMount
            >
              {(formik) => (
                <Card>
                  <CardContent className="p-6">
                    <Form className="space-y-5">
                      <div className="space-y-2">
                        <Input
                          name="serviceDate"
                          type="date"
                          label={t('arrivals.bussing.dateOfService')}
                          aria-describedby="dateofservice"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('arrivals.form.dateFormat')}
                        </p>
                      </div>

                      <ImageUpload
                        name="mobilisationPicture"
                        error={formik.errors.mobilisationPicture}
                        placeholder={t('arrivals.form.uploadMobilisationPicture')}
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="ImageUpload"
                      />

                      <SubmitButton formik={formik} />
                    </Form>
                  </CardContent>
                </Card>
              )}
            </Formik>
          </div>

          <Dialog
            open={showCodeFullscreen}
            onOpenChange={setShowCodeFullscreen}
          >
            <DialogContent
              className="flex h-svh w-screen max-w-none flex-col items-center justify-center gap-6 rounded-none border-0 bg-background p-6 sm:max-w-none"
              showCloseButton={false}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>{t('arrivals.bacenta.codeOfDay')}</DialogTitle>
                <DialogDescription>
                  {t('arrivals.bacenta.fullscreenCodeDescription')}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('arrivals.bacenta.codeOfDay')}
              </p>
              <p className="break-all text-center font-mono text-[clamp(4rem,22vw,16rem)] font-black leading-none tabular-nums text-foreground dark:text-yellow-300">
                {codeOfTheDay ?? '—'}
              </p>
              <Button
                variant="outline"
                size="lg"
                className="mt-4"
                onClick={() => setShowCodeFullscreen(false)}
              >
                {t('arrivals.common.close')}
              </Button>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ApolloWrapper>
  )
}

export default FormMobilisationSubmission
