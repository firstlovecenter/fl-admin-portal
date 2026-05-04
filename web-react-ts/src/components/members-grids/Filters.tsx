import { ChurchContext } from 'contexts/ChurchContext'
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  TITLE_OPTIONS,
} from 'global-utils'
import React, { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { Formik, Form, FormikHelpers, FormikState } from 'formik'
import { GET_CAMPUS_BASONTAS } from 'queries/ListQueries'
import { Button } from 'components/ui/button'
import { Separator } from 'components/ui/separator'
import CheckboxGroup from 'components/formik/CheckboxGroup'
import CheckboxWithQuery from 'components/formik/CheckboxWithQuery'

type FormOptions = {
  gender: string[]
  maritalStatus: string[]
  occupation: string
  leaderTitle: string[]
  leaderRank: string[]
  basonta: string[]
}

const LEADER_OPTIONS = [
  { key: 'CO', value: 'CO' },
  { key: 'Bacenta Leader', value: 'Bacenta Leader' },
  { key: 'Fellowship Leader', value: 'Fellowship Leader' },
  { key: 'Hub Fellowship Leader', value: 'Hub Fellowship Leader' },
  { key: 'Hub Leader', value: 'Hub Leader' },
  { key: 'Hub Council Leader', value: 'Hub Council Leader' },
  { key: 'Ministry Leader', value: 'Ministry Leader' },
  { key: 'Creative Arts Overseer', value: 'Creative Arts Overseer' },
  { key: 'Admin', value: 'Admin' },
]

const Filters = ({ onClose }: { onClose?: () => void }) => {
  const { setFilters, filters, campusId } = useContext(ChurchContext)
  const location = useLocation()
  const atPastors = location.pathname === '/pastors'

  const initialValues: FormOptions = {
    gender: filters.gender || [],
    maritalStatus: filters.maritalStatus || [],
    occupation: filters.occupation || '',
    leaderTitle: atPastors ? ['Pastor'] : filters.leaderTitle || [],
    leaderRank: filters.leaderRank || [],
    basonta: filters.basonta || [],
  }

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    setFilters(values)
    onSubmitProps.setSubmitting(false)
    onClose?.()
  }

  const handleReset = (
    resetForm: (nextState?: Partial<FormikState<FormOptions>>) => void
  ) => {
    const emptyValues: FormOptions = {
      gender: [],
      maritalStatus: [],
      occupation: '',
      leaderTitle: [],
      leaderRank: [],
      basonta: [],
    }
    setFilters(emptyValues)
    resetForm({ values: emptyValues })
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {(formik) => (
        <Form>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <CheckboxGroup
                label="Gender"
                name="gender"
                options={GENDER_OPTIONS}
              />
            </div>
            <div>
              <CheckboxGroup
                label="Marital Status"
                name="maritalStatus"
                options={MARITAL_STATUS_OPTIONS}
              />
            </div>
            <div>
              <CheckboxWithQuery
                name="basonta"
                modifier="filter"
                optionsQuery={GET_CAMPUS_BASONTAS}
                queryVariable="id"
                initialValue=""
                dataset=""
                varValue={campusId}
                nestedDataset={['campuses', 'basontas']}
                label="Select a Ministry"
              />
            </div>
            <div>
              <CheckboxGroup
                label="Leader Rank"
                name="leaderRank"
                options={LEADER_OPTIONS}
              />
            </div>
            <div>
              <CheckboxGroup
                label="Leader Title"
                name="leaderTitle"
                options={TITLE_OPTIONS}
              />
            </div>
          </div>

          <Separator className="my-5" />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-foreground"
              onClick={() => handleReset(formik.resetForm)}
            >
              Reset
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!formik.isValid || formik.isSubmitting}
            >
              Apply Filters
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default Filters
