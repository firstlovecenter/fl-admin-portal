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
import { useRouter } from 'next/navigation'
import {
  Button,
  Container,
  Row,
  Col,
  ButtonGroup,
  Modal,
} from 'react-bootstrap'
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
  const router = useRouter()

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
      <Container>
        <HeadingPrimary>{title}</HeadingPrimary>
        <HeadingSecondary>{initialValues.name + ' Ministry'}</HeadingSecondary>
        <ButtonGroup className="mt-3">
          {!newMinistry && (
            <>
              <Button onClick={() => setHubCouncilModal(true)}>
                Add HubCouncil
              </Button>
              <Button variant="success" onClick={() => setCloseDown(true)}>
                Close Down Ministry
              </Button>
            </>
          )}
        </ButtonGroup>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          validateOnMount
        >
          {(formik) => (
            <Container className="py-4">
              <Form>
                <div className="form-group">
                  <Row className="row-cols-1 row-cols-md-2">
                    {/* <!-- Basic Info Div --> */}
                    <Col className="mb-2">
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
                        label="Name of Ministry"
                        placeholder="Name of Ministry"
                      />
                      <Select
                        label="Ministry Account"
                        name="bankAccount"
                        options={MINISTRY_ACCOUNT_OPTIONS}
                      />

                      <Row className="d-flex align-items-center mb-3">
                        <Col>
                          <SearchMember
                            name="leaderId"
                            label="Choose a Leader"
                            placeholder="Start typing..."
                            initialValue={initialValues?.leaderName}
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search Box"
                            error={formik.errors.leaderId}
                            creativeArts
                          />
                        </Col>
                      </Row>
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
                    </Col>
                  </Row>
                </div>

                <div className="text-center mt-5">
                  <SubmitButton formik={formik} />
                </div>
              </Form>

              <Modal
                show={hubCouncilModal}
                onHide={() => setHubCouncilModal(false)}
                centered
              >
                <Modal.Header closeButton>Add A HubCouncil</Modal.Header>
                <Modal.Body>
                  <p>Choose a hubCouncil to move to this ministry</p>
                  <SearchHubCouncil
                    name="hubCouncil"
                    placeholder="HubCouncil Name"
                    initialValue=""
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="HubCouncil Name"
                  />
                </Modal.Body>
                <Modal.Footer>
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
                    variant="primary"
                    onClick={() => setHubCouncilModal(false)}
                  >
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>

              <Modal
                show={closeDown}
                onHide={() => setCloseDown(false)}
                centered
              >
                <Modal.Header closeButton>Close Down Ministry</Modal.Header>
                <Modal.Body>
                  <p className="text-info">
                    Are you sure you want to close down this ministry?
                  </p>
                </Modal.Body>
                <Modal.Footer>
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
                        router.push(`/ministry/displayall`)
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
                  <Button variant="primary" onClick={() => setCloseDown(false)}>
                    No, take me back
                  </Button>
                </Modal.Footer>
              </Modal>
            </Container>
          )}
        </Formik>
      </Container>
    </ApolloWrapper>
  )
}

export default MinistryForm
