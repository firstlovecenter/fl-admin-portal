import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import {
  STREAM_ACCOUNT_OPTIONS,
  STREAM_SERVICE_DAY_OPTIONS,
  VACATION_OPTIONS,
  throwToSentry,
} from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_STREAM_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import RoleView from 'auth/RoleView'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import { permitAdmin } from 'permission-utils'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import SearchCouncil from 'components/formik/SearchCouncil'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Council, Campus, VacationStatusOptions } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import Select from 'components/formik/Select'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { DISPLAY_STREAM, DISPLAY_CAMPUS } from '../display/ReadQueries'
import { MOVE_COUNCIL_TO_STREAM } from '../update/UpdateMutations'

export interface StreamFormValues extends FormikInitialValues {
  campus?: Campus
  bankAccount:
    | 'manual'
    | 'aes_account'
    | 'fle_account'
    | 'acc_floc'
    | 'bjosh_special'
    | 'oa_kumasi'
    | 'oa_ghnorth'
    | 'oa_ghsouth'
    | 'oa_gheast'
    | 'oa_ghwest'
    | 'oa_tarkwa'
    | 'oa_sunyani'
  meetingDay: 'Friday' | 'Saturday' | 'Sunday'
  vacationStatus: VacationStatusOptions
  councils?: Council[]
  council?: Council
}

type StreamFormProps = {
  initialValues: StreamFormValues
  onSubmit: (
    values: StreamFormValues,
    onSubmitProps: FormikHelpers<StreamFormValues>
  ) => void
  title: string
  newStream: boolean
}

const StreamForm = ({
  initialValues,
  onSubmit,
  title,
  newStream,
}: StreamFormProps) => {
  const { t } = useTranslation()
  const { clickCard, streamId } = useContext(ChurchContext)
  const [councilModal, setCouncilModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownStream] = useMutation(MAKE_STREAM_INACTIVE, {
    refetchQueries: [
      { query: DISPLAY_CAMPUS, variables: { id: initialValues?.campus?.id } },
    ],
  })
  const [MoveCouncilToStream] = useMutation(MOVE_COUNCIL_TO_STREAM, {
    refetchQueries: [{ query: DISPLAY_STREAM, variables: { id: streamId } }],
  })
  const validationSchema = Yup.object({
    name: Yup.string().required(
      t('directory.streamForm.validation.nameRequired')
    ),
    leaderId: Yup.string().required(
      t('directory.streamForm.validation.leaderRequired')
    ),
    vacationStatus: Yup.string().required(
      t('directory.streamForm.validation.vacationStatusRequired')
    ),
    meetingDay: Yup.string().required(
      t('directory.streamForm.validation.meetingDayRequired')
    ),
  })

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>
        {initialValues.name} {t('shared.churchLevel.Stream')}
      </HeadingSecondary>
      <div className="mt-3 inline-flex gap-2">
        {!newStream && (
          <>
            <Button onClick={() => setCouncilModal(true)}>
              {t('directory.streamForm.addCouncil')}
            </Button>
            <Button
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
              onClick={() => setCloseDown(true)}
            >
              {t('directory.streamForm.closeDown')}
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
                      label={t('directory.streamForm.nameLabel')}
                      placeholder={t('directory.streamForm.namePlaceholder')}
                    />

                    <Select
                      label={t('directory.streamForm.meetingDayLabel')}
                      name="meetingDay"
                      options={STREAM_SERVICE_DAY_OPTIONS}
                      defaultOption={t(
                        'directory.streamForm.meetingDayDefaultOption'
                      )}
                    />
                    <Select
                      label={t('directory.streamForm.vacationStatusLabel')}
                      name="vacationStatus"
                      options={VACATION_OPTIONS}
                      defaultOption={t(
                        'directory.streamForm.vacationStatusDefaultOption'
                      )}
                    />
                    <Select
                      label={t('directory.streamForm.bankAccountLabel')}
                      name="bankAccount"
                      options={STREAM_ACCOUNT_OPTIONS}
                    />

                    <div className="mb-3 flex items-center">
                      <RoleView roles={permitAdmin('Campus')}>
                        <div className="flex-1">
                          <SearchMember
                            name="leaderId"
                            label={t('directory.streamForm.leaderLabel')}
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
                      {initialValues.councils?.length ? (
                        <p className="text-lg font-semibold">
                          {t('shared.churchLevelPlural.Council')}
                        </p>
                      ) : null}
                      {initialValues.councils?.map((council, index) => {
                        if (!council && !index) {
                          return (
                            <NoDataComponent
                              text={t('directory.streamForm.noCouncils')}
                              key="no"
                            />
                          )
                        }
                        return (
                          <Button
                            key={council?.id ?? index}
                            type="button"
                            variant="secondary"
                            className="justify-start text-left"
                          >
                            {council.name} {t('shared.churchLevel.Council')}
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

            <Dialog open={councilModal} onOpenChange={setCouncilModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t('directory.streamForm.addCouncilDialogTitle')}
                  </DialogTitle>
                </DialogHeader>
                <p>{t('directory.streamForm.addCouncilDialogBody')}</p>
                <SearchCouncil
                  name="council"
                  placeholder={t(
                    'directory.streamForm.councilNamePlaceholder'
                  )}
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Council Name"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading || !formik.values.council}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await MoveCouncilToStream({
                          variables: {
                            councilId: formik.values.council?.id,
                            historyRecord: `${formik.values.council?.name} Council has been moved to ${formik.values.name} Stream from ${formik.values.council?.stream.name} Stream`,
                            newStreamId: streamId,
                            oldStreamId: formik.values.council?.stream.id,
                          },
                        })

                        clickCard(res.data.MoveCouncilToStream)
                        setCouncilModal(false)
                      } catch (error) {
                        throwToSentry(
                          `There was an error moving this council to this stream`,
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
                    onClick={() => setCouncilModal(false)}
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
                    {t('directory.streamForm.closeDown')}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-[hsl(var(--maps))]">
                  {t('directory.streamForm.closeDownConfirm')}
                </p>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await CloseDownStream({
                          variables: {
                            id: streamId,
                            leaderId: initialValues.leaderId,
                            adminId: initialValues?.adminId,
                          },
                        })

                        setButtonLoading(false)
                        if (!res.data?.CloseDownStream) {
                          throw (
                            res.errors?.[0] ??
                            new Error('Unable to close down stream')
                          )
                        }
                        clickCard(res.data.CloseDownStream)
                        setCloseDown(false)
                        navigate(`/council/displayall`)
                      } catch (error) {
                        setButtonLoading(false)
                        throwToSentry(
                          `There was an error closing down this stream`,
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

export default StreamForm
