import { useContext } from 'react'
import { Button } from 'components/ui/button'
import { SearchContext } from 'contexts/MemberContext'
import './SearchBox.css'
import { useNavigate } from 'react-router-dom'
import { Form, Formik, FormikHelpers } from 'formik'

const SearchBox = ({ handleShow }: { handleShow: () => void }) => {
  const { setSearchKey } = useContext(SearchContext)
  const navigate = useNavigate()
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
    navigate('/search-results')
    onSubmitProps.setSubmitting(false)
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formik) => (
        <Form>
          <div className="flex mt-4">
            <input
              name="searchKeyVal"
              className="nav-search-box flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Search for anything..."
              aria-label="Search for anything..."
              aria-describedby="submit-search"
              onChange={(e) =>
                formik.setFieldValue('searchKeyVal', e.target.value)
              }
            />
            <Button id="submit-search" variant="success" type="submit" className="rounded-l-none">
              Search
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default SearchBox
