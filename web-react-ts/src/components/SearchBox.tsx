'use client'

import { useContext } from 'react'
import { Button, InputGroup, Form as bsForm } from 'react-bootstrap'
import { SearchContext } from 'contexts/MemberContext'
import './SearchBox.css'
import { useRouter } from 'next/navigation'
import { Form, Formik, FormikHelpers } from 'formik'

const SearchBox = ({ handleShow }: { handleShow: () => void }) => {
  const { setSearchKey } = useContext(SearchContext)
  const router = useRouter()
  const initialValues = {
    searchKeyVal: '',
  }

  const onSubmit = (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    setSearchKey(values.searchKeyVal)
    handleShow()
    router.push('/search-results')
    onSubmitProps.setSubmitting(false)
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formik) => (
        <Form>
          <InputGroup className="mt-4">
            <bsForm.Control
              name="searchKeyVal"
              className="nav-search-box"
              placeholder="Search for anything..."
              aria-label="Search for anything..."
              aria-describedby="submit-search"
              onChange={(e) =>
                formik.setFieldValue('searchKeyVal', e.target.value)
              }
            />
            <Button id="submit-search" variant="success" type="submit">
              Search
            </Button>
          </InputGroup>
        </Form>
      )}
    </Formik>
  )
}

export default SearchBox
