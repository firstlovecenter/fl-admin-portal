import React from 'react'
import { Container } from 'react-bootstrap'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'

const QuickFactsChurchList = () => {
  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <div className="text-center">
          <h1 className="mb-1 "> Church List</h1>
          <HeadingSecondary>Click on one of churches below</HeadingSecondary>
        </div>
        <ChurchList color="quick-facts" />
      </Container>
    </div>
  )
}

export default QuickFactsChurchList
