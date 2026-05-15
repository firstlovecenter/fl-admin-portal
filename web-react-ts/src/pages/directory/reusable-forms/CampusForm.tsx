import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { CURRENCY_OPTIONS, YES_NO_OPTIONS, throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_CAMPUS_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import RoleView from 'auth/RoleView'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import { permitAdmin } from 'permission-utils'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import SearchStream from 'components/formik/SearchStream'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Oversight, Stream } from 'global-types'
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
import { MOVE_STREAM_TO_CAMPUS } from '../update/UpdateMutations'
import { DISPLAY_CAMPUS, DISPLAY_OVERSIGHT } from '../display/ReadQueries'

export interface CampusFormValues extends FormikInitialValues {
  oversight?: Oversight
  streams?: Stream[]
  stream?: Stream
  incomeTracking: 'Yes' | 'No'
  currency: 'GHS' | 'USD' | 'GBP' | 'EUR'
  conversionRateToDollar: number
}

type CampusFormProps = {
  initialValues: CampusFormValues
  onSubmit: (
    values: CampusFormValues,
    onSubmitProps: FormikHelpers<CampusFormValues>
  ) => void
  title: string
  newCampus: boolean
}

const CampusForm = ({
  initialValues,
  onSubmit,
  title,
  newCampus,
}: CampusFormProps) => {
  const { clickCard, campusId } = useContext(ChurchContext)
  const [streamModal, setStreamModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownCampus] = useMutation(MAKE_CAMPUS_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_OVERSIGHT,
        variables: { id: initialValues?.oversight?.id },
      },
    ],
  })
  const [MoveStreamToCampus] = useMutation(MOVE_STREAM_TO_CAMPUS, {
    refetchQueries: [{ query: DISPLAY_CAMPUS, variables: { id: campusId } }],
  })
  const validationSchema = Yup.object({
    name: Yup.string().required(`Campus Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{`${initialValues.name} Campus`}</HeadingSecondary>
      <div className="mt-3 inline-flex gap-2">
        {!newCampus && (
          <>
            <Button onClick={() => setStreamModal(true)}>Add Stream</Button>
            <Button
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
              onClick={() => setCloseDown(true)}
            >
              Close Down Campus
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
                      label="Name of Campus"
                      placeholder="Name of Campus"
                    />

                    <Select
                      name="incomeTracking"
                      label="Will you be tracking income for this Campus?"
                      options={YES_NO_OPTIONS}
                      defaultOption="Choose One"
                    />

                    <Select
                      name="currency"
                      label="Currency"
                      options={CURRENCY_OPTIONS}
                      defaultOption="Select a Currency"
                    />

                    <Input
                      name="conversionRateToDollar"
                      label="Dollar Conversion Rate (How Much Is $1 In Currency)"
                      placeholder="Dollar Conversion Rate"
                    />

                    <div className="mb-3 flex items-center">
                      <RoleView roles={permitAdmin('Oversight')}>
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
                      {initialValues.streams?.length ? (
                        <p className="text-lg font-semibold">Streams</p>
                      ) : null}
                      {initialValues.streams?.map((stream, index) => {
                        if (!stream && !index) {
                          return <NoDataComponent text="No Streams" key="no" />
                        }
                        return (
                          <Button
                            key={stream?.id ?? index}
                            type="button"
                            variant="secondary"
                            className="justify-start text-left"
                          >
                            {stream.name} Stream
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

            <Dialog open={streamModal} onOpenChange={setStreamModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add A Stream</DialogTitle>
                </DialogHeader>
                <p>Choose a stream to move to this campus</p>
                <SearchStream
                  name="stream"
                  placeholder="Stream Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Stream Name"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading || !formik.values.stream}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await MoveStreamToCampus({
                          variables: {
                            streamId: formik.values.stream?.id,
                            historyRecord: `${formik.values.stream?.name} Stream has been moved to ${formik.values.name} Campus from ${formik.values.stream?.campus.name} Campus`,
                            newCampusId: campusId,
                            oldCampusId: formik.values.stream?.campus.id,
                          },
                        })

                        clickCard(res.data.MoveStreamToCampus)
                        setStreamModal(false)
                      } catch (error) {
                        throwToSentry(
                          `There was an error moving this stream to this campus`,
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
                    onClick={() => setStreamModal(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={closeDown} onOpenChange={setCloseDown}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Down Campus</DialogTitle>
                </DialogHeader>
                <p className="text-[hsl(var(--maps))]">
                  Are you sure you want to close down this campus?
                </p>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await CloseDownCampus({
                          variables: {
                            id: campusId,
                            leaderId: initialValues.leaderId,
                            adminId: initialValues?.adminId,
                          },
                        })

                        setButtonLoading(false)
                        clickCard(res.data.CloseDownCampus)
                        setCloseDown(false)
                        navigate(`/stream/displayall`)
                      } catch (error) {
                        setButtonLoading(false)
                        throwToSentry(
                          `There was an error closing down this campus`,
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

export default CampusForm
