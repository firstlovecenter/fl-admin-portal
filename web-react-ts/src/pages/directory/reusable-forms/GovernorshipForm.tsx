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
import { Bacenta, Council, Hub } from 'global-types'
import {
  MOVE_BACENTA_TO_GOVERNORSHIP,
  MOVE_HUB_TO_GOVERNORSHIP,
} from '../update/UpdateMutations'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { DISPLAY_GOVERNORSHIP, DISPLAY_COUNCIL } from '../display/ReadQueries'
import BtnSubmitText from 'components/formik/BtnSubmitText'
import SearchHub from 'components/formik/SearchHub'
import { displayError, isPermissionError } from 'utils/errorHandler'

export interface GovernorshipFormValues extends FormikInitialValues {
  council?: Council
  bacentas?: Bacenta[]
  hubs?: Hub[]
  hub?: Hub
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
  const [hubModal, setHubModal] = useState(false)
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
  const [MoveHubToGovernorship] = useMutation(MOVE_HUB_TO_GOVERNORSHIP, {
    refetchQueries: [
      { query: DISPLAY_GOVERNORSHIP, variables: { id: governorshipId } },
    ],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required(`Governorship Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <div>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>
        {initialValues.name + ' Governorship'}
      </HeadingSecondary>

      <div className="mt-3">
        {!newGovernorship && (
          <>
            <Button onClick={() => setBacentaModal(true)}>Add Bacenta</Button>
            <Button variant="warning" onClick={() => setHubModal(true)}>
              Add Hub
            </Button>
            <Button variant="success" onClick={() => setCloseDown(true)}>
              {`Close Down Governorship`}
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
                <div className="row-cols-1 row-cols-md-2">
                  {/* <!-- Basic Info Div --> */}
                  <div className="mb-2">
                    <Input
                      name="name"
                      label={`Name of Governorship`}
                      placeholder={`Name of Governorship`}
                    />

                    <div className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Council')}>
                        <div>
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
                    <div className="d-grid gap-2">
                      {initialValues.bacentas?.length && (
                        <p className="fw-bold fs-5">Bacentas</p>
                      )}
                      {initialValues.bacentas?.map((bacenta, index) => {
                        if (!bacenta && !index)
                          return <NoDataComponent text="No Bacentas" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {bacenta.name} {bacenta.__typename}
                          </Button>
                        )
                      })}
                    </div>

                    <div className="d-grid gap-2 mt-3">
                      {initialValues.hubs?.length && (
                        <p className="fw-bold fs-5">Hubs</p>
                      )}
                      {initialValues.hubs?.map((hub, index) => {
                        if (!hub && !index)
                          return <NoDataComponent text="No Hubs" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {hub.name} {hub.__typename}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-5">
                <SubmitButton formik={formik} />
              </div>
            </Form>

            <Dialog open={bacentaModal} onOpenChange={(open) => { if (!open) () => setBacentaModal(false)() }}
              centered
            ><DialogContent>
              <DialogHeader>Add A Bacenta</DialogHeader>
              
                <p>Choose a bacenta to move to this governorship</p>
                <SearchBacenta
                  name={`bacenta`}
                  placeholder="Bacenta Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Bacenta Name"
                />
              
              <DialogFooter>
                <Button
                  variant="success"
                  type="submit"
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
                  variant="default"
                  onClick={() => setBacentaModal(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent></Dialog>

            <Dialog open={hubModal} onOpenChange={(open) => { if (!open) () => setHubModal(false)() }} centered><DialogContent>
              <DialogHeader>Add A Hub</DialogHeader>
              
                <p>Choose a hub to move to this governorship</p>
                <SearchHub
                  name={`hub`}
                  placeholder="Hub Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Hub Name"
                />
              
              <DialogFooter>
                <Button
                  variant="success"
                  type="submit"
                  disabled={buttonLoading || !formik.values.hub}
                  onClick={async () => {
                    try {
                      setButtonLoading(true)
                      const res = await MoveHubToGovernorship({
                        variables: {
                          hubId: formik.values.hub?.id,
                          historyRecord: `${formik.values.hub?.name} Hub has been moved to ${formik.values.name} Governorship from ${formik.values.hub?.governorship.name} Governorship`,
                          newGovernorshipId: governorshipId,
                          oldGovernorshipId: formik.values.hub?.governorship.id,
                        },
                      })

                      clickCard(res.data.MoveHubToGovernorship)
                      setHubModal(false)
                    } catch (error) {
                      if (!isPermissionError(error)) {
                        throwToSentry(`Error moving hub to governorship`, error)
                      }
                      displayError('Unable to Move Hub', error)
                    } finally {
                      setButtonLoading(false)
                    }
                  }}
                >
                  <BtnSubmitText loading={buttonLoading} />
                </Button>
                <Button variant="default" onClick={() => setHubModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent></Dialog>

            <Dialog open={closeDown} onOpenChange={(open) => { if (!open) () => setCloseDown(false)() }} centered><DialogContent>
              <DialogHeader>Close Down Governorship</DialogHeader>
              
                <p className="text-info">
                  Are you sure you want to close down this governorship?
                </p>
              
              <DialogFooter>
                <Button
                  variant="success"
                  type="submit"
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
                        throwToSentry(`Error closing down governorship`, error)
                      }
                      displayError('Unable to Close Down Governorship', error)
                    } finally {
                      setButtonLoading(false)
                    }
                  }}
                >
                  <BtnSubmitText loading={buttonLoading} />
                </Button>
                <Button variant="default" onClick={() => setCloseDown(false)}>
                  No, take me back
                </Button>
              </DialogFooter>
            </DialogContent></Dialog>
          </div>
        )}
      </Formik>
    </div>
  )
}

export default GovernorshipForm
