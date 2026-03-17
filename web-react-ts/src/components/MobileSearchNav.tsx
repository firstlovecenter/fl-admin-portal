import React, { useContext, useState } from 'react'
import { Formik, Form, FormikHelpers } from 'formik'
import { SearchContext } from '../contexts/MemberContext'
import './SearchBox.css'
import { Button } from 'components/ui/button'
import { Loader2 } from 'lucide-react'

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
          <div className="flex mt-4">
            <input
              name="ghostKey"
              className="nav-search-box flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              className="rounded-l-none"
            >
              {formik.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default MobileSearchNav
