import { useContext, useState } from 'react'
import { Formik, Form, FormikHelpers } from 'formik'
import { SearchContext } from 'contexts/MemberContext'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Loader2, Search } from 'lucide-react'

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
          <div className="flex gap-2 mt-4">
            <Input
              name="ghostKey"
              placeholder="Search for anything..."
              aria-label="Search for anything..."
              value={ghostKey}
              onChange={(e) => setGhostKey(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={formik.isSubmitting}
              className="shrink-0 gap-1.5"
            >
              {formik.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default MobileSearchNav
