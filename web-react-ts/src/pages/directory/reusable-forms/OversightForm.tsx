import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_OVERSIGHT_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import RoleView from 'auth/RoleView'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import { permitAdmin } from 'permission-utils'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import SearchCampus from 'components/formik/SearchCampus'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Campus, Denomination } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { MOVE_CAMPUS_TO_OVERSIGHT } from '../update/UpdateMutations'
import {
  DISPLAY_OVERSIGHT,
  DISPLAY_DENOMINATION,
} from '../display/ReadQueries'

export interface OversightFormValues extends FormikInitialValues {
  denomination?: Denomination
  campuses?: Campus[]
  campus?: Campus
}

type OversightFormProps = {
  initialValues: OversightFormValues
  onSubmit: (
    values: OversightFormValues,
    onSubmitProps: FormikHelpers<OversightFormValues>
  ) => void
  title: string
  newOversight: boolean
}

const OversightForm = ({
  initialValues,
  onSubmit,
  title,
  newOversight,
}: OversightFormProps) => {
  const { t } = useTranslation()
  const { clickCard, oversightId } = useContext(ChurchContext)
  const [campusModal, setCampusModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownOversight] = useMutation(MAKE_OVERSIGHT_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_DENOMINATION,
        variables: { id: initialValues?.denomination?.id },
      },
    ],
  })
  const [MoveCampusToOversight] = useMutation(MOVE_CAMPUS_TO_OVERSIGHT, {
    refetchQueries: [
      { query: DISPLAY_OVERSIGHT, variables: { id: oversightId } },
    ],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required(
      t('directory.oversightForm.validation.nameRequired')
    ),
    leaderId: Yup.string().required(
      t('directory.oversightForm.validation.leaderRequired')
    ),
  })

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>
        {initialValues.name} {t('shared.churchLevel.Oversight')}
      </HeadingSecondary>
      <div className="mt-3 inline-flex gap-2">
        {!newOversight && (
          <>
            <Button onClick={() => setCampusModal(true)}>
              {t('directory.oversightForm.addCampus')}
            </Button>
            <Button
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
              onClick={() => setCloseDown(true)}
            >
              {t('directory.oversightForm.closeDown')}
            </Button>
          </>
        )}
      </div>

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
                      label={t('directory.oversightForm.nameLabel')}
                      placeholder={t(
                        'directory.oversightForm.namePlaceholder'
                      )}
                    />

                    <div className="mb-3 flex items-center">
                      <RoleView roles={permitAdmin('Denomination')}>
                        <div className="flex-1">
                          <SearchMember
                            name="leaderId"
                            label={t('directory.oversightForm.leaderLabel')}
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
                        {t('shared.churchLevelPlural.Campus')}
                      </p>
                      {initialValues.campuses?.map((campus, index) => {
                        if (!campus && !index) {
                          return (
                            <NoDataComponent
                              text={t('directory.oversightForm.noCampuses')}
                              key="no"
                            />
                          )
                        }
                        return (
                          <Button
                            key={campus?.id ?? index}
                            type="button"
                            variant="secondary"
                            className="justify-start text-left"
                          >
                            {campus.name} {t('shared.churchLevel.Campus')}
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

            <Dialog open={campusModal} onOpenChange={setCampusModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t('directory.oversightForm.addCampusDialogTitle')}
                  </DialogTitle>
                </DialogHeader>
                <p>{t('directory.oversightForm.addCampusDialogBody')}</p>
                <SearchCampus
                  name="campus"
                  placeholder={t(
                    'directory.oversightForm.campusNamePlaceholder'
                  )}
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Campus Name"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading || !formik.values.campus}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await MoveCampusToOversight({
                          variables: {
                            campusId: formik.values.campus?.id,
                            historyRecord: `${formik.values.campus?.name} Campus has been moved to ${formik.values.name} Oversight from ${formik.values.campus?.oversight.name} Oversight`,
                            newOversightId: oversightId,
                            oldOversightId: formik.values.campus?.oversight.id,
                          },
                        })

                        clickCard(res.data.MoveCampusToOversight)
                        setCampusModal(false)
                      } catch (error) {
                        throwToSentry(
                          `There was an error moving this campus to this oversight`,
                          error
                        )
                      } finally {
                        setButtonLoading(false)
                      }
                    }}
                  >
                    <BtnSubmitText loading={buttonLoading} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCampusModal(false)}
                  >
                    {t('directory.common.close')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={closeDown} onOpenChange={setCloseDown}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t('directory.oversightForm.closeDown')}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-[hsl(var(--maps))]">
                  {t('directory.oversightForm.closeDownConfirm')}
                </p>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await CloseDownOversight({
                          variables: {
                            id: oversightId,
                            leaderId: initialValues.leaderId,
                            adminId: initialValues?.adminId,
                          },
                        })

                        setButtonLoading(false)
                        if (!res.data?.CloseDownOversight) {
                          throw (
                            res.errors?.[0] ??
                            new Error('Unable to close down oversight')
                          )
                        }
                        clickCard(res.data.CloseDownOversight)
                        setCloseDown(false)
                        navigate(`/campus/displayall`)
                      } catch (error) {
                        setButtonLoading(false)
                        throwToSentry(
                          `There was an error closing down this oversight`,
                          error
                        )
                      }
                    }}
                  >
                    <BtnSubmitText loading={buttonLoading} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCloseDown(false)}
                  >
                    {t('directory.governorshipForm.closeDownCancel')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Formik>
    </div>
  )
}

export default OversightForm
