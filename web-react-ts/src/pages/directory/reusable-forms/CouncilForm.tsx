import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_COUNCIL_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import RoleView from 'auth/RoleView'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import { permitAdmin } from 'permission-utils'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import SearchGovernorship from 'components/formik/SearchGovernorship'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Governorship, Stream } from 'global-types'
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
import { MOVE_GOVERNORSHIP_TO_COUNCIL } from '../update/UpdateMutations'
import { DISPLAY_COUNCIL, DISPLAY_STREAM } from '../display/ReadQueries'

export interface CouncilFormValues extends FormikInitialValues {
  stream?: Stream
  governorships?: Governorship[]
  governorship?: Governorship
}

type CouncilFormProps = {
  initialValues: CouncilFormValues
  onSubmit: (
    values: CouncilFormValues,
    onSubmitProps: FormikHelpers<CouncilFormValues>
  ) => void
  title: string
  newCouncil: boolean
}

const CouncilForm = ({
  initialValues,
  onSubmit,
  title,
  newCouncil,
}: CouncilFormProps) => {
  const { clickCard, councilId } = useContext(ChurchContext)
  const [governorshipModal, setGovernorshipModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownCouncil] = useMutation(MAKE_COUNCIL_INACTIVE, {
    refetchQueries: [
      { query: DISPLAY_STREAM, variables: { id: initialValues?.stream?.id } },
    ],
  })
  const [MoveGovernorshipToCouncil] = useMutation(
    MOVE_GOVERNORSHIP_TO_COUNCIL,
    {
      refetchQueries: [
        { query: DISPLAY_COUNCIL, variables: { id: councilId } },
      ],
    }
  )
  const validationSchema = Yup.object({
    name: Yup.string().required(`Council Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{`${initialValues.name} Council`}</HeadingSecondary>
      <div className="mt-3 inline-flex gap-2">
        {!newCouncil && (
          <>
            <Button onClick={() => setGovernorshipModal(true)}>
              Add Governorship
            </Button>
            <Button
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
              onClick={() => setCloseDown(true)}
            >
              Close Down Council
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
                      label="Name of Council"
                      placeholder="Name of Council"
                    />

                    <div className="mb-3 flex items-center">
                      <RoleView roles={permitAdmin('Stream')}>
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
                      {initialValues.governorships?.length ? (
                        <p className="text-lg font-semibold">Governorships</p>
                      ) : null}

                      {initialValues.governorships?.map(
                        (governorship, index) => {
                          if (!governorship && !index) {
                            return (
                              <NoDataComponent
                                text="No Governorships"
                                key="no"
                              />
                            )
                          }
                          return (
                            <Button
                              key={governorship?.id ?? index}
                              type="button"
                              variant="secondary"
                              className="justify-start text-left"
                            >
                              {governorship.name} Governorship
                            </Button>
                          )
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <SubmitButton formik={formik} />
              </div>
            </Form>

            <Dialog
              open={governorshipModal}
              onOpenChange={setGovernorshipModal}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add A Governorship</DialogTitle>
                </DialogHeader>
                <p>Choose a governorship to move to this council</p>
                <SearchGovernorship
                  name="governorship"
                  placeholder="Governorship Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Governorship Name"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading || !formik.values.governorship}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await MoveGovernorshipToCouncil({
                          variables: {
                            governorshipId: formik.values.governorship?.id,
                            historyRecord: `${formik.values.governorship?.name} Governorship has been moved to ${formik.values.name} Council from ${formik.values.governorship?.council.name} Council`,
                            newCouncilId: councilId,
                            oldCouncilId:
                              formik.values.governorship?.council.id,
                          },
                        })

                        clickCard(res.data.MoveGovernorshipToCouncil)
                        setGovernorshipModal(false)
                      } catch (error) {
                        throwToSentry(
                          `There was an error moving this governorship to this council`,
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
                    onClick={() => setGovernorshipModal(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={closeDown} onOpenChange={setCloseDown}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Down Council</DialogTitle>
                </DialogHeader>
                <p className="text-[hsl(var(--maps))]">
                  Are you sure you want to close down this council?
                </p>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await CloseDownCouncil({
                          variables: {
                            id: councilId,
                            leaderId: initialValues.leaderId,
                            adminId: initialValues?.adminId,
                          },
                        })

                        setButtonLoading(false)
                        clickCard(res.data.CloseDownCouncil)
                        setCloseDown(false)
                        navigate(`/council/displayall`)
                      } catch (error) {
                        setButtonLoading(false)
                        throwToSentry(
                          `There was an error closing down this council`,
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

export default CouncilForm
