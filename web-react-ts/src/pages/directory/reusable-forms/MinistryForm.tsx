import { useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import {
  MINISTRY_ACCOUNT_OPTIONS,
  makeSelectOptions,
  throwToSentry,
} from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_MINISTRY_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
import { useNavigate } from 'react-router'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import SubmitButton from 'components/formik/SubmitButton'
import SearchMember from 'components/formik/SearchMember'
import Input from 'components/formik/Input'
import { FormikInitialValues } from 'components/formik/formik-types'
import { CreativeArts, HubCouncil } from 'global-types'
import { DISPLAY_MINISTRY } from '../display/ReadQueries'
import HeadingSecondary from 'components/HeadingSecondary'
import SearchHubCouncil from 'components/formik/SearchHubCouncil'
import { MOVE_HUBCOUNCIL_TO_MINISTRY } from '../update/UpdateMutations'
import NoDataComponent from 'pages/arrivals/CompNoData'
import Select from 'components/formik/Select'
import { GET_CREATIVEARTS_STREAMS } from './SontaListQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import BtnSubmitText from 'components/formik/BtnSubmitText'

export interface MinistryFormValues extends FormikInitialValues {
  name: string
  stream?: string
  creativeArts?: CreativeArts
  bankAccount:
    | 'accra_greater_love_choir'
    | 'accra_dancing_stars'
    | 'accra_film_stars'
  hubCouncil?: HubCouncil
  hubCouncils?: HubCouncil[]
}

type MinistryFormProps = {
  initialValues: MinistryFormValues
  onSubmit: (
    values: MinistryFormValues,
    onSubmitProps: FormikHelpers<MinistryFormValues>
  ) => void
  title: string
  newMinistry: boolean
}

const MinistryForm = ({
  initialValues,
  onSubmit,
  title,
  newMinistry,
}: MinistryFormProps) => {
  const { clickCard, creativeArtsId, ministryId } = useContext(ChurchContext)
  const [hubCouncilModal, setHubCouncilModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)
  const navigate = useNavigate()

  const [buttonLoading, setButtonLoading] = useState(false)
  const { data, loading, error } = useQuery(GET_CREATIVEARTS_STREAMS, {
    variables: {
      creativeArtsId,
    },
  })
  const [CloseDownMinistry] = useMutation(MAKE_MINISTRY_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_MINISTRY,
        variables: { id: ministryId },
      },
    ],
  })
  const [MoveHubCouncilToMinistry] = useMutation(MOVE_HUBCOUNCIL_TO_MINISTRY, {
    refetchQueries: [
      {
        query: DISPLAY_MINISTRY,
        variables: { id: ministryId },
      },
    ],
  })

  const validationSchema = Yup.object({
    name: Yup.string().required(`Ministry Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })
  const streamOptions = makeSelectOptions(data?.creativeArts[0].streams)

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <HeadingPrimary>{title}</HeadingPrimary>
        <HeadingSecondary>{initialValues.name + ' Ministry'}</HeadingSecondary>
        <div className="mt-3">
          {!newMinistry && (
            <>
              <Button onClick={() => setHubCouncilModal(true)}>
                Add HubCouncil
              </Button>
              <Button variant="success" onClick={() => setCloseDown(true)}>
                {`Close Down Ministry`}
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
                      {newMinistry && (
                        <Select
                          name="stream"
                          label="Select a Stream"
                          options={streamOptions}
                          defaultOption="Select a Stream"
                        />
                      )}

                      <Input
                        name="name"
                        label={`Name of Ministry`}
                        placeholder={`Name of Ministry`}
                      />
                      <Select
                        label="Ministry Account"
                        name="bankAccount"
                        options={MINISTRY_ACCOUNT_OPTIONS}
                      />

                      <div className="d-flex align-items-center mb-3">
                        <div>
                          <SearchMember
                            name="leaderId"
                            label="Choose a Leader"
                            placeholder="Start typing..."
                            initialValue={initialValues?.leaderName}
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search Box"
                            error={formik.errors.leaderId}
                            creativeArts={true}
                          />
                        </div>
                      </div>
                      <div className="d-grid gap-2">
                        {initialValues.hubCouncils?.length === 0 ? (
                          <NoDataComponent text="No Hub Councils" />
                        ) : (
                          <p className="fw-bold fs-5">Hub Councils</p>
                        )}

                        {initialValues.hubCouncils?.map((hubCouncil, index) => (
                          <Button variant="secondary" className="text-start">
                            {hubCouncil.name} HubCouncil
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-5">
                  <SubmitButton formik={formik} />
                </div>
              </Form>

              <Dialog open={hubCouncilModal} onOpenChange={(open) => { if (!open) () => setHubCouncilModal(false)() }}
                centered
              ><DialogContent>
                <DialogHeader>Add A HubCouncil</DialogHeader>
                
                  <p>Choose a hubCouncil to move to this ministry</p>
                  <SearchHubCouncil
                    name={`hubCouncil`}
                    placeholder="HubCouncil Name"
                    initialValue=""
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="HubCouncil Name"
                  />
                
                <DialogFooter>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={buttonLoading || !formik.values.hubCouncil}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await MoveHubCouncilToMinistry({
                          variables: {
                            hubCouncilId: formik.values.hubCouncil?.id,
                            historyRecord: `${formik.values.hubCouncil?.name} HubCouncil has been moved to ${formik.values.name} Ministry from ${formik.values.hubCouncil?.ministry.name} Ministry`,
                            newMinistryId: ministryId,
                            oldMinistryId:
                              formik.values.hubCouncil?.ministry.id,
                          },
                        })

                        clickCard(res.data.MoveHubCouncilToMinistry)
                        setHubCouncilModal(false)
                      } catch (error) {
                        throwToSentry(
                          `There was an error moving this hubCouncil to this ministry`,
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
                    variant="default"
                    onClick={() => setHubCouncilModal(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent></Dialog>

              <Dialog open={closeDown} onOpenChange={(open) => { if (!open) () => setCloseDown(false)() }}
                centered
              ><DialogContent>
                <DialogHeader>Close Down Ministry</DialogHeader>
                
                  <p className="text-info">
                    Are you sure you want to close down this ministry?
                  </p>
                
                <DialogFooter>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={buttonLoading}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await CloseDownMinistry({
                          variables: {
                            ministryId,
                            leaderId: initialValues.leaderId,
                            adminId: initialValues?.adminId,
                          },
                        })

                        setButtonLoading(false)
                        clickCard(res.data.CloseDownMinistry)
                        setCloseDown(false)
                        navigate(`/ministry/displayall`)
                      } catch (error) {
                        setButtonLoading(false)
                        throwToSentry(
                          `There was an error closing down this ministry`,
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
    </ApolloWrapper>
  )
}

export default MinistryForm
