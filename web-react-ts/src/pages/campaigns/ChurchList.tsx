import React from 'react'
import { Container } from 'react-bootstrap'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'

const CampaignChurchList = () => {
  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <div className="text-center">
          <h1 className="mb-1 ">Campaign Church List</h1>
          <HeadingSecondary>Click on one of churches below</HeadingSecondary>
        </div>
        <ChurchList color="campaigns" />
      </Container>
    </div>
  )
}

export default CampaignChurchList
