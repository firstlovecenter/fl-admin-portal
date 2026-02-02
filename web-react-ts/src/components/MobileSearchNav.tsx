'use client'

import React, { useContext, useState } from 'react'
import { Formik, Form, FormikHelpers } from 'formik'
import { SearchContext } from '../contexts/MemberContext'
import './SearchBox.css'
import { Button, InputGroup, Spinner, Form as bsForm } from 'react-bootstrap'

const MobileSearchNav = () => {
  const { searchKey, setSearchKey } = useContext(SearchContext)
  const [ghostKey, setGhostKey] = useState<string>(searchKey ?? '')

  const initialValues = {
    ghostKey: searchKey ?? '',
  }

  const onSubmit = (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    setSearchKey(ghostKey)
    onSubmitProps.setSubmitting(false)
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formik) => (
        <Form>
          <InputGroup className="mt-4">
            <bsForm.Control
              name="ghostKey"
              className="nav-search-box"
              placeholder="Search for anything..."
              aria-label="Search for anything..."
              aria-describedby="submit-search"
              value={ghostKey}
              onChange={(e) => setGhostKey(e.target.value)}
            />
            <Button
              id="submit-search"
              variant="success"
              type="submit"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? <Spinner /> : 'Search'}
            </Button>
          </InputGroup>
        </Form>
      )}
    </Formik>
  )
}

export default MobileSearchNav
