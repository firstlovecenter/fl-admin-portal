import { useQuery } from '@apollo/client'
import BaseComponent from 'components/base-component/BaseComponent'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { transformCloudinaryImg } from 'global-utils'
import React, { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { DISPLAY_BUSSING_RECORDS } from './arrivalsQueries'

const MobilisationPicture = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { bussingRecordId } = useContext(ServiceContext)
  const navigate = useNavigate()
  const { data, loading, error } = useQuery(DISPLAY_BUSSING_RECORDS, {
    variables: { bussingRecordId: bussingRecordId, bacentaId: bacentaId },
  })
  const bussing = data?.bussingRecords[0]

  return (
    <BaseComponent loading={loading} error={error} data={data} placeholder>
      <Container className="text-center">
        <HeadingPrimary>MobilisationPicture</HeadingPrimary>
        <img
          className="report-picture"
          src={transformCloudinaryImg(bussing?.mobilisationPicture, 'large')}
        />
        <div className="d-grid gap-2">
          <Button size="lg" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </Container>
    </BaseComponent>
  )
}

export default MobilisationPicture
