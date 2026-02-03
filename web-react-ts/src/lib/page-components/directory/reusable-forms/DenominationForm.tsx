import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import RoleView from 'auth/RoleView'
import { Button, Container, Row, Col } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import SubmitButton from 'components/formik/SubmitButton'
import Input from 'components/formik/Input'
import SearchMember from 'components/formik/SearchMember'
import { FormikInitialValues } from 'components/formik/formik-types'
import { Oversight } from 'global-types'
import NoDataComponent from 'pages/arrivals/CompNoData'

export interface DenominationFormValues extends FormikInitialValues {
  oversights?: Oversight[]
  oversight?: Oversight
}

type DenominationFormProps = {
  initialValues: DenominationFormValues
  onSubmit: (
    values: DenominationFormValues,
    onSubmitProps: FormikHelpers<DenominationFormValues>
  ) => void
  title: string
  newDenomination: boolean
}

const DenominationForm = ({
  initialValues,
  onSubmit,
  title,
  newDenomination,
}: DenominationFormProps) => {
  const validationSchema = Yup.object({
    name: Yup.string().required(`Denomination Name is a required field`),
    leaderId: Yup.string().required(
      'Please choose a leader from the drop down'
    ),
  })

  return (
    <Container>
      <HeadingPrimary>{title}</HeadingPrimary>
      <HeadingSecondary>
        {initialValues.name + ' Denomination'}
      </HeadingSecondary>

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
                      label="Name of Denomination"
                      placeholder="Name of Denomination"
                    />

                    <Row className="d-flex align-items-center mb-3">
                      <RoleView roles={['fishers']}>
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
                      </RoleView>
                    </Row>
                    <div className="d-grid gap-2">
                      <p className="fw-bold fs-5">Oversights</p>
                      {initialValues.oversights?.map((oversight, index) => {
                        if (!oversight && !index)
                          return <NoDataComponent text="No Oversights" />
                        return (
                          <Button variant="secondary" className="text-start">
                            {oversight.name} Oversight
                          </Button>
                        )
                      })}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="text-center mt-5">
                <SubmitButton formik={formik} />
              </div>
            </Form>
          </Container>
        )}
      </Formik>
    </Container>
  )
}

export default DenominationForm
