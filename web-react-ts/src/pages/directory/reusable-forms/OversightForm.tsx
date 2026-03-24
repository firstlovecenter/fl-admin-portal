import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
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
import { MOVE_CAMPUS_TO_OVERSIGHT } from '../update/UpdateMutations'
import NoDataComponent from 'pages/arrivals/CompNoData'
import { DISPLAY_OVERSIGHT, DISPLAY_DENOMINATION } from '../display/ReadQueries'
import BtnSubmitText from 'components/formik/BtnSubmitText'

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
    name: Yup.string().required(`Oversight Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <div>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>{initialValues.name + ' Oversight'}</HeadingSecondary>
      <div className="mt-3">
        {!newOversight && (
          <>
            <Button onClick={() => setCampusModal(true)}>Add Campus</Button>
            <Button variant="success" onClick={() => setCloseDown(true)}>
              {`Close Down Oversight`}
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
                      label={`Name of Oversight`}
                      placeholder={`Name of Oversight`}
                    />

                    <div className="d-flex align-items-center mb-3">
                      <RoleView roles={permitAdmin('Denomination')}>
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
                      <p className="fw-bold fs-5">Campuses</p>
                      {initialValues.campuses?.map((campus, index) => {
                        if (!campus && !index)
                          return <NoDataComponent text="No Campuses" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {campus.name} Campus
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

            <Dialog open={campusModal} onOpenChange={(open) => { if (!open) () => setCampusModal(false)() }}
              centered
            ><DialogContent>
              <DialogHeader>Add A Campus</DialogHeader>
              
                <p>Choose a campus to move to this oversight</p>
                <SearchCampus
                  name={`campus`}
                  placeholder="Campus Name"
                  initialValue=""
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="Campus Name"
                />
              
              <DialogFooter>
                <Button
                  variant="success"
                  type="submit"
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
                <Button variant="default" onClick={() => setCampusModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent></Dialog>

            <Dialog open={closeDown} onOpenChange={(open) => { if (!open) () => setCloseDown(false)() }} centered><DialogContent>
              <DialogHeader>Close Down Oversight</DialogHeader>
              
                <p className="text-info">
                  Are you sure you want to close down this oversight?
                </p>
              
              <DialogFooter>
                <Button
                  variant="success"
                  type="submit"
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

export default OversightForm
