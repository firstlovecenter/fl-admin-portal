import { useMutation } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { throwToSentry } from 'global-utils'
import { useContext, useState } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_CREATIVEARTS_INACTIVE } from 'pages/directory/update/CloseChurchMutations'
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
import { Ministry } from 'global-types'
import { DISPLAY_CREATIVEARTS } from '../display/ReadQueries'
import HeadingSecondary from 'components/HeadingSecondary'
import SearchMinistry from 'components/formik/SearchMinistry'
import { MOVE_MINISTRY_TO_CREATIVEARTS } from '../update/UpdateMutations'
import NoDataComponent from 'pages/arrivals/CompNoData'
import BtnSubmitText from 'components/formik/BtnSubmitText'

export interface CreativeArtsFormValues extends FormikInitialValues {
  name: string
  campus?: string
  creativeArts?: string
  ministry?: Ministry
  ministries?: Ministry[]
}

type CreativeArtsFormProps = {
  initialValues: CreativeArtsFormValues
  onSubmit: (
    values: CreativeArtsFormValues,
    onSubmitProps: FormikHelpers<CreativeArtsFormValues>
  ) => void
  title: string
  newCreativeArts: boolean
}

const CreativeArtsForm = ({
  initialValues,
  onSubmit,
  title,
  newCreativeArts,
}: CreativeArtsFormProps) => {
  const { clickCard, creativeArtsId } = useContext(ChurchContext)
  const [ministryModal, setMinistryModal] = useState(false)
  const [closeDown, setCloseDown] = useState(false)
  const router = useRouter()

  const [buttonLoading, setButtonLoading] = useState(false)
  const [CloseDownCreativeArts] = useMutation(MAKE_CREATIVEARTS_INACTIVE, {
    refetchQueries: [
      {
        query: DISPLAY_CREATIVEARTS,
        variables: { id: creativeArtsId },
      },
    ],
  })
  const [MoveMinistryToCreativeArts] = useMutation(
    MOVE_MINISTRY_TO_CREATIVEARTS,
    {
      refetchQueries: [
        {
          query: DISPLAY_CREATIVEARTS,
          variables: { id: creativeArtsId },
        },
      ],
    }
  )

  const validationSchema = Yup.object({
    name: Yup.string().required(`Creative Arts Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <>
      <Container>
        <HeadingPrimary>{title}</HeadingPrimary>
        <HeadingSecondary>
          {initialValues.name + ' Creative Arts'}
        </HeadingSecondary>
        <ButtonGroup className="mt-3">
          {!newCreativeArts && (
            <>
              <Button onClick={() => setMinistryModal(true)}>
                Add Ministry
              </Button>
              <Button variant="success" onClick={() => setCloseDown(true)}>
                {`Close Down Creative Arts`}
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
                      <Input
                        name="name"
                        label={`Name of Creative Arts`}
                        placeholder={`Name of Creative Arts`}
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
                          />
                        </Col>
                      </Row>
                      <div className="d-grid gap-2">
                        {initialValues.ministries?.length === 0 ? (
                          <NoDataComponent text="No ministries" />
                        ) : (
                          <p className="fw-bold fs-5">Ministries</p>
                        )}

                        {initialValues.ministries?.map((ministry, index) => (
                          <Button variant="secondary" className="text-start">
                            {ministry.name} Ministry
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
                show={ministryModal}
                onHide={() => setMinistryModal(false)}
                centered
              >
                <Modal.Header closeButton>Add A Ministry</Modal.Header>
                <Modal.Body>
                  <p>Choose a ministry to move to this creativearts</p>
                  <SearchMinistry
                    name={`ministry`}
                    placeholder="Ministry Name"
                    initialValue=""
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="Ministry Name"
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={buttonLoading || !formik.values.ministry}
                    onClick={async () => {
                      try {
                        setButtonLoading(true)
                        const res = await MoveMinistryToCreativeArts({
                          variables: {
                            ministryId: formik.values.ministry?.id,
                            historyRecord: `${formik.values.ministry?.name} Ministry has been moved to ${formik.values.name} CreativeArts from ${formik.values.ministry?.creativeArts.name} CreativeArts`,
                            newCreativeArtsId: creativeArtsId,
                            oldCreativeArtsId:
                              formik.values.ministry?.creativeArts.id,
                          },
                        })

                        clickCard(res.data.MoveMinistryToCreativeArts)
                        setMinistryModal(false)
                      } catch (error) {
                        throwToSentry(
                          `There was an error moving this ministry to this creative arts`,
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
                    onClick={() => setMinistryModal(false)}
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
                <Modal.Header closeButton>Close Down CreativeArts</Modal.Header>
                <Modal.Body>
                  <p className="text-info">
                    Are you sure you want to close down this creativearts?
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
                        const res = await CloseDownCreativeArts({
                          variables: {
                            creativeArtsId,
                            leaderId: initialValues.leaderId,
                            adminId: initialValues?.adminId,
                          },
                        })

                        setButtonLoading(false)
                        clickCard(res.data.CloseDownCreativeArts)
                        setCloseDown(false)
                        router.push(`/creativearts/displayall`)
                      } catch (error) {
                        setButtonLoading(false)
                        throwToSentry(
                          `There was an error closing down this creativearts`,
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
    </>
  )
}

export default CreativeArtsForm
