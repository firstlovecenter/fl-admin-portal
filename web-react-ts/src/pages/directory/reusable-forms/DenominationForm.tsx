import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import RoleView from 'auth/RoleView'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Oversight } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { Button } from 'components/ui/button'

export interface DenominationFormValues extends FormikInitialValues {
  oversights?: Oversight[]
  oversight?: Oversight
}

type DenominationFormProps = {
  initialValues: DenominationFormValues
  onSubmit: (
    values: DenominationFormValues,
    onSubmitProps: FormikHelpers<DenominationFormValues>
  ) => void
  title: string
  newDenomination: boolean
}

const DenominationForm = ({
  initialValues,
  onSubmit,
  title,
}: DenominationFormProps) => {
  const { t } = useTranslation()
  const validationSchema = Yup.object({
    name: Yup.string().required(
      t('directory.denominationForm.validation.nameRequired')
    ),
    leaderId: Yup.string().required(
      t('directory.denominationForm.validation.leaderRequired')
    ),
  })

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>
        {initialValues.name} {t('shared.churchLevel.Denomination')}
      </HeadingSecondary>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        validateOnMount
      >
        {(formik) => (
          <div className="py-4">
            <Form>
              <div className="form-group">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="mb-2 space-y-3">
                    <Input
                      name="name"
                      label={t('directory.denominationForm.nameLabel')}
                      placeholder={t(
                        'directory.denominationForm.namePlaceholder'
                      )}
                    />

                    <div className="mb-3 flex items-center">
                      <RoleView roles={['fishers']}>
                        <div className="flex-1">
                          <SearchMember
                            name="leaderId"
                            label={t('directory.denominationForm.leaderLabel')}
                            placeholder={t('directory.common.startTyping')}
                            initialValue={initialValues?.leaderName}
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search Box"
                            error={formik.errors.leaderId}
                          />
                        </div>
                      </RoleView>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-lg font-semibold">
                        {t('shared.churchLevelPlural.Oversight')}
                      </p>
                      {initialValues.oversights?.map((oversight, index) => {
                        if (!oversight && !index) {
                          return (
                            <NoDataComponent
                              text={t(
                                'directory.denominationForm.noOversights'
                              )}
                              key="no"
                            />
                          )
                        }
                        return (
                          <Button
                            key={oversight?.id ?? index}
                            type="button"
                            variant="secondary"
                            className="justify-start text-left"
                          >
                            {oversight.name}{' '}
                            {t('shared.churchLevel.Oversight')}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <SubmitButton formik={formik} />
              </div>
            </Form>
          </div>
        )}
      </Formik>
    </div>
  )
}

export default DenominationForm
