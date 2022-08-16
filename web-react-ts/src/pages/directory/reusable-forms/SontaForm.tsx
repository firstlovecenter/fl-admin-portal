import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { makeSelectOptions } from 'global-utils'
import { permitAdmin } from 'permission-utils'
import {
  GET_COUNCIL_CONSTITUENCIES,
  GET_GATHERINGSERVICE_MINISTRIES,
} from 'queries/ListQueries'
import React, { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { DISPLAY_CONSTITUENCY } from 'pages/directory/display/ReadQueries'
import RoleView from 'auth/RoleView'
import Select from 'components/formik/Select'
import SearchMember from 'components/formik/SearchMember'
import { FormikInitialValues } from 'components/formik/formik-types'

export interface SontaFormValues extends FormikInitialValues {
  ministrySelect: string
  constituency: string
}

type SontaFormProps = {
  initialValues: SontaFormValues
  onSubmit: (
    values: SontaFormValues,
    onSubmitProps: FormikHelpers<SontaFormValues>
  ) => void
  title: string
  loading: boolean
  newSonta: boolean
}

const SontaForm = ({
  initialValues,
  onSubmit,
  title,
  newSonta,
  loading,
}: SontaFormProps) => {
  const { constituencyId, councilId, gatheringServiceId } =
    useContext(ChurchContext)

  const {
    data: councilData,
    loading: councilLoading,
    error: councilError,
  } = useQuery(GET_COUNCIL_CONSTITUENCIES, {
    variables: { id: councilId },
  })

  const {
    data: constituenciesData,
    loading: constituenciesLoading,
    error: constituenciesError,
  } = useQuery(DISPLAY_CONSTITUENCY, {
    variables: { id: constituencyId },
  })

  const { data: ministryListData, loading: ministryListLoading } = useQuery(
    GET_GATHERINGSERVICE_MINISTRIES,
    {
      variables: {
        id: gatheringServiceId,
      },
    }
  )

  const constituencyLoading = constituenciesLoading
  const constituency = constituenciesData?.constituencies[0]

  const validationSchema = Yup.object({
    ministrySelect: Yup.string().required('You must choose a ministry'),
    leaderId: Yup.string().required('Please choose a leader from the dropdown'),
  })

  const ministryOptions = makeSelectOptions(ministryListData?.ministries)
  const constituencyOptions = makeSelectOptions(
    councilData?.members[0].leadsCouncil
  )

  const sontasNotInconstituency = ministryOptions?.filter((ministry) => {
    return !constituency?.sontas.some(
      (sonta: { [x: string]: string }) =>
        sonta['name'] === `${constituency?.name} ${ministry.key}`
    )
  })

  return (
    <ApolloWrapper
      loading={
        constituencyLoading ||
        ministryListLoading ||
        constituenciesLoading ||
        councilLoading ||
        loading
      }
      error={constituenciesError && councilError}
      data={constituenciesData && ministryListData && councilData}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {(formik) => (
          <div className=" py-4 container mt-5">
            <div className="container infobar">{title}</div>
            <Form>
              <div className="form-group">
                <div className="row row-cols-1 row-cols-md-2">
                  {/* <!-- Create Sonta Div --> */}
                  <div className="col mb-2">
                    <div className="form-row row-cols-2">
                      <div className="col-10">
                        <RoleView roles={permitAdmin('Council')}>
                          <Select
                            label={`Select a Constituency`}
                            name="constituency"
                            options={constituencyOptions}
                            defaultOption={`Select a Constituency`}
                          />
                        </RoleView>
                        <RoleView roles={permitAdmin('Constituency')}>
                          <label className="label">{`Constituency:`}</label>
                          <div className="pl-2">
                            <p>{`${constituency?.name} Constituency`}</p>
                          </div>
                        </RoleView>
                      </div>
                    </div>

                    <div className="form-row row-cols-3">
                      <div className="col-10">
                        <Select
                          label="Ministry*"
                          name="ministrySelect"
                          options={
                            newSonta ? sontasNotInconstituency : ministryOptions
                          }
                          defaultOption="Ministry"
                        />
                      </div>
                    </div>
                    <div className="row d-flex align-items-center">
                      <div className="col">
                        <SearchMember
                          name="leaderId"
                          initialValue={initialValues?.leaderName}
                          label="Select a Leader"
                          placeholder="Select a Leader"
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="Member Search Box"
                          error={formik.errors.leaderId}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center m">
                <button
                  type="submit"
                  disabled={!formik.isValid || formik.isSubmitting}
                  className="btn btn-primary px-5 py-3"
                >
                  Submit
                </button>
              </div>
            </Form>
          </div>
        )}
      </Formik>
    </ApolloWrapper>
  )
}

export default SontaForm
