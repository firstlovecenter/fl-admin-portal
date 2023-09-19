import { ChurchContext } from 'contexts/ChurchContext'
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  TITLE_OPTIONS,
} from 'global-utils'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { Formik, Form, FormikHelpers } from 'formik'
import { GET_CAMPUS_MINISTRIES } from 'queries/ListQueries'
import { Col, Row, Button } from 'react-bootstrap'
import './Filters.css'
import CheckboxGroup from 'components/formik/CheckboxGroup'
import CheckboxWithQuery from 'components/formik/CheckboxWithQuery'

type FormOptions = {
  gender: string[]
  maritalStatus: string[]
  occupation: string
  leaderTitle: string[]
  leaderRank: string[]
  ministry: string[]
}

const Filters = ({
  ToggleAccordion,
}: {
  [x: string]: any
  children: any
  eventKey: any
}) => {
  const { setFilters, filters, campusId } = useContext(ChurchContext)
  const location = useLocation()
  const atPastors = location.pathname === '/pastors'

  const initialValues: FormOptions = {
    gender: filters.gender || [],
    maritalStatus: filters.maritalStatus || [],
    occupation: filters.occupation || '',
    leaderTitle: atPastors ? ['Pastor'] : filters.leaderTitle || [],
    leaderRank: filters.leaderRank || [],
    ministry: filters.ministry || [],
  }

  const LEADER_OPTIONS = [
    { key: 'CO', value: 'CO' },
    { key: 'Bacenta Leader', value: 'Bacenta Leader' },
    { key: 'Fellowship Leader', value: 'Fellowship Leader' },
    { key: 'Admin', value: 'Admin' },
  ]

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    setFilters(values)
    onSubmitProps.setSubmitting(false)
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formik) => (
        <Form>
          <div className="form-group ">
            <Row xs={1} md={2}>
              {/* <!-- Basic Info Div --> */}
              <Col className="filter-col">
                <CheckboxGroup
                  label="Gender"
                  name="gender"
                  options={GENDER_OPTIONS}
                />
              </Col>
              <Col className="filter-col">
                <CheckboxGroup
                  label="Marital Status"
                  name="maritalStatus"
                  options={MARITAL_STATUS_OPTIONS}
                />
              </Col>

              <Col className="filter-col">
                <CheckboxWithQuery
                  name="ministry"
                  modifier="filter"
                  optionsQuery={GET_CAMPUS_MINISTRIES}
                  queryVariable="id"
                  initialValue=""
                  dataset=""
                  varValue={campusId}
                  nestedDataset={['campuses', 'creativeArts']}
                  label="Select a Ministry"
                />
              </Col>

              <Col className="filter-col">
                <CheckboxGroup
                  label="Leader Rank"
                  name="leaderRank"
                  options={LEADER_OPTIONS}
                />
              </Col>
              <Col className="filter-col">
                <CheckboxGroup
                  label="Leader Title"
                  name="leaderTitle"
                  options={TITLE_OPTIONS}
                />
              </Col>
            </Row>
            <Button
              variant="primary"
              type="reset"
              className={`btn-secondary px-5`}
              onClick={() => {
                setFilters({
                  gender: [],
                  maritalStatus: [],
                  occupation: '',
                  leaderTitle: [],
                  leaderRank: [],
                  ministry: [],
                })
              }}
            >
              Reset Filters
            </Button>

            <ToggleAccordion>
              <Button
                variant="success"
                type="submit"
                className={`px-5`}
                disabled={!formik.isValid || formik.isSubmitting}
              >
                Apply Filters
              </Button>
            </ToggleAccordion>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default Filters
