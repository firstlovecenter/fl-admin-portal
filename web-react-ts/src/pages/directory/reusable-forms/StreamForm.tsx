import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
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
    name: Yup.string().required(`Stream Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
    vacationStatus: Yup.string().required(
      'Vacation Status is a required field'
    ),
    meetingDay: Yup.string().required('Meeting Day is a required field'),
  })

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{`${initialValues.name} Stream`}</HeadingSecondary>
      <div className="mt-3 inline-flex gap-2">
        {!newStream && (
          <>
            <Button onClick={() => setCouncilModal(true)}>Add Council</Button>
            <Button
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
              onClick={() => setCloseDown(true)}
            >
              Close Down Stream
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
                      label="Name of Stream"
                      placeholder="Name of Stream"
                    />

                    <Select
                      label="Meeting Day"
                      name="meetingDay"
                      options={STREAM_SERVICE_DAY_OPTIONS}
                      defaultOption="Pick a Service Day"
                    />
                    <Select
                      label="Vacation Status"
                      name="vacationStatus"
                      options={VACATION_OPTIONS}
                      defaultOption="Select Vacation Status"
                    />
                    <Select
                      label="Stream Account"
                      name="bankAccount"
                      options={STREAM_ACCOUNT_OPTIONS}
                    />

                    <div className="mb-3 flex items-center">
                      <RoleView roles={permitAdmin('Campus')}>
                        <div className="flex-1">
                          <SearchMember
                            name="leaderId"
                            label="Choose a Leader"
                            placeholder="Start typing..."
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
                        <p className="text-lg font-semibold">Councils</p>
                      ) : null}
                      {initialValues.councils?.map((council, index) => {
                        if (!council && !index) {
                          return <NoDataComponent text="No Councils" key="no" />
                        }
                        return (
                          <Button
                            key={council?.id ?? index}
                            type="button"
                            variant="secondary"
                            className="justify-start text-left"
                          >
                            {council.name} Council
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
                  <DialogTitle>Add A Council</DialogTitle>
                </DialogHeader>
                <p>Choose a council to move to this stream</p>
                <SearchCouncil
                  name="council"
                  placeholder="Council Name"
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
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={closeDown} onOpenChange={setCloseDown}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Down Stream</DialogTitle>
                </DialogHeader>
                <p className="text-[hsl(var(--maps))]">
                  Are you sure you want to close down this stream?
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
                    No, take me back
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
