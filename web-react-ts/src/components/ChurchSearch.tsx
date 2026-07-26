import React, { useEffect, useState } from 'react'
import { Formik, Form, FormikHelpers } from 'formik'
import { useTranslation } from 'react-i18next'
import { Church, ChurchLevel, HigherChurch } from 'global-types'
import Input from './formik/Input'
import ChurchList from './DisplayChurchList'
import './ChurchSearch.css'

type ChurchSearchProps = {
  data: Church[]
  churchType: ChurchLevel
}

const ChurchSearch = (props: ChurchSearchProps) => {
  const churchDataLoaded = props.data
  const { t } = useTranslation()
  const [churchData, setChurchData] = useState<Church[]>([])

  useEffect(() => {
    setChurchData(churchDataLoaded)
  }, [churchDataLoaded])

  const initialValues = {
    churchSearch: '',
  }

  const onSubmit = (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    setChurchData(
      churchDataLoaded.filter(
        (church: any) =>
          church.name
            .toLowerCase()
            .includes(values.churchSearch.toLowerCase()) ||
          church.leader.firstName
            .toLowerCase()
            .includes(values.churchSearch.toLowerCase()) ||
          church.leader.lastName
            .toLowerCase()
            .includes(values.churchSearch.toLowerCase())
      )
    )

    onSubmitProps.setSubmitting(false)
  }

  return (
    <div>
      <div className="mx-auto mt-3 max-w-screen-md px-4">
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => (
            <Form>
              <Input
                className="form-control church-search search-center"
                name="churchSearch"
                placeholder={t('shared.churchSearch.placeholder')}
                aria-label={t('shared.churchSearch.ariaLabel')}
              />
            </Form>
          )}
        </Formik>
      </div>

      <ChurchList
        data={churchData as unknown as HigherChurch[]}
        churchType={props.churchType}
      />
    </div>
  )
}

export default ChurchSearch
