import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_GOVERNORSHIP_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import RoleView from 'auth/RoleView'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import { permitAdmin } from 'permission-utils'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import SearchBacenta from 'components/formik/SearchBacenta'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Bacenta, Council } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import { displayError, isPermissionError } from 'utils/errorHandler'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { MOVE_BACENTA_TO_GOVERNORSHIP } from '../update/UpdateMutations'
import { DISPLAY_GOVERNORSHIP, DISPLAY_COUNCIL } from '../display/ReadQueries'

export interface GovernorshipFormValues extends FormikInitialValues {
  council?: Council
  bacentas?: Bacenta[]
  bacenta?: Bacenta
}

type GovernorshipFormProps = {
  initialValues: GovernorshipFormValues
  onSubmit: (
    values: GovernorshipFormValues,
    onSubmitProps: FormikHelpers<GovernorshipFormValues>
  ) => void
  title: string
  newGovernorship: boolean
}

const GovernorshipForm = ({
  initialValues,
  onSubmit,
  title,
  newGovernorship,
}: GovernorshipFormProps) => {
  const { clickCard, governorshipId } = useContext(ChurchContext)
  const [bacentaModal, setBacentaModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)

  const navigate = useNavigate()
  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownGovernorship] = useMutation(MAKE_GOVERNORSHIP_INACTIVE, {
    refetchQueries: [
      { query: DISPLAY_COUNCIL, variables: { id: initialValues.council?.id } },
    ],
  })
  const [MoveBacentaToGovernorship] = useMutation(
    MOVE_BACENTA_TO_GOVERNORSHIP,
    {
      refetchQueries: [
        { query: DISPLAY_GOVERNORSHIP, variables: { id: governorshipId } },
      ],
    }
  )
  const validationSchema = Yup.object({
    name: Yup.string().required(`Governorship Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{`${initialValues.name} Governorship`}</HeadingSecondary>

      <div className="mt-3 inline-flex gap-2">
        {!newGovernorship && (
          <>
            <Button onClick={() => setBacentaModal(true)}>Add Bacenta</Button>
            <Button
              className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
              onClick={() => setCloseDown(true)}
            >
              Close Down Governorship
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
                      label="Name of Governorship"
                      placeholder="Name of Governorship"
                    />

                    <div className="mb-3 flex items-center">
                      <RoleView roles={permitAdmin('Council')}>
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
                      {initialValues.bacentas?.length ? (
                        <p className="text-lg font-semibold">Bacentas</p>
                      ) : null}
                      {initialValues.bacentas?.map((bacenta, index) => {
                        if (!bacenta && !index) {
                          return <NoDataComponent text="No Bacentas" key="no" />
                        }
                        return (
                          <Button
                            key={bacenta?.id ?? index}
                            type="button"
                            variant="secondary"
                            className="justify-start text-left"
                          >
                            {bacenta.name} {bacenta.__typename}
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

            <Dialog open={bacentaModal} onOpenChange={setBacentaModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add A Bacenta</DialogTitle>
                </DialogHeader>
                <p>Choose a bacenta to move to this governorship</p>
                <SearchBacenta
                  name="bacenta"
                  placeholder="Bacenta Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Bacenta Name"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading || !formik.values.bacenta}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await MoveBacentaToGovernorship({
                          variables: {
                            bacentaId: formik.values.bacenta?.id,
                            historyRecord: `${formik.values.bacenta?.name} Bacenta has been moved to ${formik.values.name} Governorship from ${formik.values.bacenta?.governorship.name} Governorship`,
                            newGovernorshipId: governorshipId,
                            oldGovernorshipId:
                              formik.values.bacenta?.governorship.id,
                          },
                        })

                        clickCard(res.data.MoveBacentaToGovernorship)
                        setBacentaModal(false)
                      } catch (error) {
                        if (!isPermissionError(error)) {
                          throwToSentry(
                            `Error moving bacenta to governorship`,
                            error
                          )
                        }
                        displayError('Unable to Move Bacenta', error)
                      } finally {
                        setButtonLoading(false)
                      }
                    }}
                  >
                    <BtnSubmitText loading={buttonLoading} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBacentaModal(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={closeDown} onOpenChange={setCloseDown}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close Down Governorship</DialogTitle>
                </DialogHeader>
                <p className="text-[hsl(var(--maps))]">
                  Are you sure you want to close down this governorship?
                </p>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
                    disabled={buttonLoading}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await CloseDownGovernorship({
                          variables: {
                            id: governorshipId,
                            leaderId: initialValues.leaderId,
                            adminId: initialValues?.adminId,
                          },
                        })

                        clickCard(res.data.CloseDownGovernorship)
                        setCloseDown(false)
                        navigate(`/governorship/displayall`)
                      } catch (error) {
                        if (!isPermissionError(error)) {
                          throwToSentry(
                            `Error closing down governorship`,
                            error
                          )
                        }
                        displayError(
                          'Unable to Close Down Governorship',
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

export default GovernorshipForm
