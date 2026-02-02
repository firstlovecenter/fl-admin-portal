'use client'

import { Container } from 'react-bootstrap'
import './SpinnerPage.css'
import { PacmanLoader } from 'react-spinners'
import PageContainer from './base-component/PageContainer'

const SpinnerPage = () => {
  return (
    <PageContainer>
      <Container className="center-page d-flex flex-column justify-content-center align-items-center">
        <PacmanLoader color="gray" />
      </Container>
    </PageContainer>
  )
}

export default SpinnerPage
