'use client'

import React, { useEffect, useState } from 'react'
import { Formik, Form, FormikHelpers } from 'formik'
import ChurchList from './DisplayChurchList'
import './ChurchSearch.css'
import { Container } from 'react-bootstrap'
import Input from './formik/Input'
import { Church, ChurchLevel, HigherChurch } from 'global-types'

type ChurchSearchProps = {
  data: Church[]
  churchType: ChurchLevel
}

const ChurchSearch = (props: ChurchSearchProps) => {
  const churchDataLoaded = props.data
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
      <Container className="mt-3">
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => (
            <Form>
              <div>
                <Input
                  className="form-control church-search search-center"
                  name="churchSearch"
                  placeholder="Search Churches or Leader"
                  aria-describedby="Church Search"
                />
              </div>
            </Form>
          )}
        </Formik>
      </Container>

      <ChurchList
        data={churchData as unknown as HigherChurch[]}
        churchType={props.churchType}
      />
    </div>
  )
}

export default ChurchSearch
