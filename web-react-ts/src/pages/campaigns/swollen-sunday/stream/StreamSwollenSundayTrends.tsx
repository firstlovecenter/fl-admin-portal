import { useLazyQuery, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import ChurchGraph from 'components/ChurchGraph/ChurchGraph'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FormikHelpers, Formik, Form } from 'formik'
import { getServiceGraphData } from 'pages/services/graphs/graphs-utils'
import { useContext, useState, useEffect } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Check2Circle } from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import {
  STREAM_SWOLLEN_DETAILS,
  STREAM_SWOLLEN_SUNDAY_GRAPHS,
} from '../SwollenSundayQueries'
import SwollenSundayTrends from '../SwollenSundayTrends'
import * as Yup from 'yup'

type FormOptions = {
  fromDate: string
  toDate: string
}

const StreamSwollenSundayTrends = () => {
  const { streamId } = useContext(ChurchContext)
  const navigate = useNavigate()
  const [bussing] = useState(true)
  const [selectedView, setSelectedView] = useState('BussingVsTarget')

  const initialValues: FormOptions = {
    fromDate: '2022-01-01',
    toDate: new Date().toISOString().slice(0, 10),
  }

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const {
    data: streamData,
    loading: streamLoading,
    error: streamError,
  } = useQuery(STREAM_SWOLLEN_DETAILS, {
    variables: {
      streamId,
    },
  })

  const [streamSwollenSundayGraph, { loading }] = useLazyQuery(
    STREAM_SWOLLEN_SUNDAY_GRAPHS,
    {
      onCompleted: (data) => {
        if (!setChurchData) return
        setChurchData(getServiceGraphData(data?.streams[0], 'swellBussing'))
      },
      fetchPolicy: 'cache-and-network',
    }
  )

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    streamSwollenSundayGraph({
      variables: {
        streamId,
        startDate: values.fromDate,
        endDate: values.toDate,
      },
    })
    onSubmitProps.setSubmitting(false)
  }

  const church = streamData?.streams[0]

  const churchBelow = [
    {
      name: 'Councils',
      number: church?.councilCount,
      onClick: () => navigate('/campaigns/council/swollen-sunday/councils'),
    },
    {
      name: 'Constituencies',
      number: church?.constituencyCount,
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

  useEffect(() => {
    streamSwollenSundayGraph({
      variables: {
        streamId,
        startDate: initialValues.fromDate,
        endDate: initialValues.toDate,
      },
    })
  }, [])

  return (
    <ApolloWrapper
      loading={streamLoading}
      error={streamError}
      data={streamData}
    >
      <Container>
        <h6>{church?.name} Stream</h6>
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

export default StreamSwollenSundayTrends
