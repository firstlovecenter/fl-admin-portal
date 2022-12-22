import { useLazyQuery, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import Input from 'components/formik/Input'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FormikHelpers, Formik, Form } from 'formik'
import { getServiceGraphData } from 'pages/services/graphs/graphs-utils'
import { useContext, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Check2Circle } from 'react-bootstrap-icons'
import {
  COUNCIL_SWOLLEN_DETAILS,
  COUNCIL_SWOLLEN_SUNDAY_GRAPHS,
} from '../SwollenSundayQueries'
import SwollenSundayTrends from '../SwollenSundayTrends'
import '../SwollenSunday.css'
import SubmitButton from 'components/formik/SubmitButton'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'

type FormOptions = {
  fromDate: string
  toDate: string
}

const CouncilSwollenSundayTrends = () => {
  const { councilId } = useContext(ChurchContext)
  const navigate = useNavigate()
  const [bussing] = useState(true)
  const [selectedView, setSelectedView] = useState('BussingVsTarget')

  const initialValues: FormOptions = {
    fromDate: '2022-01-01',
    toDate: new Date().toISOString().slice(0, 10),
  }

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const {
    data: councilData,
    loading: councilLoading,
    error: councilError,
  } = useQuery(COUNCIL_SWOLLEN_DETAILS, {
    variables: {
      councilId,
    },
  })

  const [councilSwollenSundayGraph, { loading }] = useLazyQuery(
    COUNCIL_SWOLLEN_SUNDAY_GRAPHS,
    {
      onCompleted: (data) => {
        if (!setChurchData) return
        setChurchData(getServiceGraphData(data?.councils[0], 'swellBussing'))
      },
      fetchPolicy: 'cache-and-network',
    }
  )

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    councilSwollenSundayGraph({
      variables: {
        councilId,
        startDate: values.fromDate,
        endDate: values.toDate,
      },
    })
    onSubmitProps.setSubmitting(false)
  }

  const church = councilData?.councils[0]

  const churchBelow = [
    {
      name: 'Constituencies',
      number: church?.constituencyCount,
      onClick: () =>
        navigate('/campaigns/constituency/swollen-sunday/constituencies'),
    },
    {
      name: 'Bacentas',
      number: church?.bacentaCount,
    },
    {
      name: 'Fellowships',
      number: church?.fellowshipCount,
    },
  ]

  const validationSchema = Yup.object({
    fromDate: Yup.date().required('From Date is a required field'),
    toDate: Yup.date()
      .required('To Date is a required field')
      .when(
        'fromDate',
        (fromDate, Yup) =>
          fromDate && Yup.min(fromDate, 'To Date cannot be before From Date')
      ),
  })

  const handleSelectChange = (value: string) => {
    setSelectedView(value)
  }

  return (
    <ApolloWrapper
      loading={councilLoading}
      error={councilError}
      data={councilData}
    >
      <Container>
        <h6>{church?.name} Council</h6>
        <HeadingSecondary>Swollen Sunday</HeadingSecondary>
        <SwollenSundayTrends churchBelow={churchBelow} church={church} />
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          validateOnMount
        >
          {(formik) => (
            <>
              <div className="text-center mt-3">
                <select
                  value={selectedView}
                  className="dropdown-quick-facts text-center"
                  name="dropdown"
                  id="dropdown"
                  onChange={(e) => handleSelectChange(e.target.value)}
                >
                  <option value="Bussing">Bussing</option>
                  <option value="BussingVsTarget">Bussing Vs Target</option>
                </select>
              </div>
              <Form>
                <div className="mt-3">
                  <Row className="align-items-center gx-1 justify-content-between ">
                    <Col className="d-inline-block" xs={5}>
                      <Input
                        name="fromDate"
                        type="date"
                        placeholder="dd/mm/yyyy"
                        aria-describedby="fromDate"
                      />
                    </Col>
                    <Col className="d-inline-block" xs={5}>
                      <Input
                        name="toDate"
                        type="date"
                        placeholder="dd/mm/yyyy"
                        aria-describedby="toDate"
                      />
                    </Col>
                    <Col xs={2} className="text-center">
                      <SubmitButton formik={formik}>
                        <Check2Circle size={23} />
                      </SubmitButton>
                    </Col>
                  </Row>
                </div>
              </Form>
              <div>
                <ChurchGraph
                  swollenSunday={true}
                  loading={loading}
                  stat1="attendance"
                  stat2={selectedView === 'Bussing' ? null : 'target'}
                  churchData={churchData || []}
                  church={church?.__typename?.toLowerCase()}
                  bussing={bussing}
                  income={true}
                />
              </div>
            </>
          )}
        </Formik>
      </Container>
    </ApolloWrapper>
  )
}

export default CouncilSwollenSundayTrends
