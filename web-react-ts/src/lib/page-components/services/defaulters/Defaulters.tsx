import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import React from 'react'
import { Container } from 'react-bootstrap'
import ChurchList from '../ChurchList'

const Defaulters = () => {
  return (
    <Container>
      <HeadingPrimary>Defaulters</HeadingPrimary>
      <HeadingSecondary>Click on one of your churches below</HeadingSecondary>

      <ChurchList color="defaulters" link="/services/defaulters/dashboard" />
    </Container>
  )
}

export default Defaulters
