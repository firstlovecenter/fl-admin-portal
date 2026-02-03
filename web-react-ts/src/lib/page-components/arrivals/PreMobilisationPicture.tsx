import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import CloudinaryImage from 'components/CloudinaryImage'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import React, { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { BussingRecord } from './arrivals-types'
import { DISPLAY_BUSSING_RECORDS } from './arrivalsQueries'
import './Arrivals.css'

const PreMobilisationPicture = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { bussingRecordId } = useContext(ServiceContext)
  const router = useRouter()
  const { data, loading, error } = useQuery(DISPLAY_BUSSING_RECORDS, {
    variables: { bussingRecordId, bacentaId },
  })
  const bussing: BussingRecord = data?.bussingRecords[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <Container className="text-center">
        <HeadingPrimary>Mobilisation Picture</HeadingPrimary>
        <CloudinaryImage
          className="report-picture"
          src={bussing?.mobilisationPicture}
          size="respond"
        />
        <div className="d-grid gap-2">
          <Button size="lg" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default PreMobilisationPicture
