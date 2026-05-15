import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import CloudinaryImage from 'components/CloudinaryImage'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
import { Button } from 'components/ui/button'
import { BussingRecord } from './arrivals-types'
import { DISPLAY_BUSSING_RECORDS } from './arrivalsQueries'
import './Arrivals.css'

const PreMobilisationPicture = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { bussingRecordId } = useContext(ServiceContext)
  const navigate = useNavigate()
  const { data, loading, error } = useQuery(DISPLAY_BUSSING_RECORDS, {
    variables: { bussingRecordId, bacentaId },
  })
  const bussing: BussingRecord = data?.bussingRecords[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data} placeholder>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4 text-center">
        <HeadingPrimary>Mobilisation Picture</HeadingPrimary>
        <CloudinaryImage
          className="report-picture"
          src={bussing?.mobilisationPicture}
          size="respond"
        />
        <div className="grid gap-2">
          <Button size="lg" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default PreMobilisationPicture
