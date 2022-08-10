import { ChurchContext } from 'contexts/ChurchContext'
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  TITLE_OPTIONS,
} from 'global-utils'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { Formik, Form } from 'formik'
import { GET_MINISTRIES } from 'queries/ListQueries'
import { Col, Row, Button } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import './Filters.css'
import CheckboxWithQuery from 'components/formik/CheckboxWithQuery'
import CheckboxGroup from 'components/formik/CheckboxGroup'

const Filters = ({ ToggleAccordion }) => {
  const { setFilters, filters } = useContext(ChurchContext)
  const { theme } = useContext(MemberContext)
  const location = useLocation()
  const atPastors = location.pathname === '/pastors'

  const initialValues = {
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
    { key: 'Sonta Leader', value: 'Sonta Leader' },
    { key: 'Fellowship Leader', value: 'Fellowship Leader' },
    { key: 'Basonta Leader', value: 'Basonta Leader' },
    { key: 'Admin', value: 'Admin' },
  ]

  const onSubmit = (values, onSubmitProps) => {
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
                  optionsQuery={GET_MINISTRIES}
                  queryVariable="id"
                  dataset="ministries"
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
            <div className="d-grid gap-2">
              <Button
                variant="primary"
                size="lg"
                type="reset"
                className={`btn-secondary ${theme}`}
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
                  variant="primary"
                  size="lg"
                  type="submit"
                  className={`btn-main ${theme}`}
                  disabled={!formik.isValid || formik.isSubmitting}
                >
                  Apply Filters
                </Button>
              </ToggleAccordion>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default Filters
