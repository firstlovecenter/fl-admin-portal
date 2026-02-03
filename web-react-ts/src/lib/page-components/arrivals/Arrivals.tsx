import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Container } from 'react-bootstrap'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'

const Arrivals = () => {
  return (
    <Container>
      <HeadingPrimary>Arrivals</HeadingPrimary>
      <HeadingSecondary>Click on one of churches below</HeadingSecondary>

      <ChurchList color="arrivals" />
    </Container>
  )
}

export default Arrivals
