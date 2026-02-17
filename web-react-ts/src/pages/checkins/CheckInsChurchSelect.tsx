import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Container } from 'react-bootstrap'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'

const CheckInsChurchSelect = () => {
  return (
    <Container>
      <HeadingPrimary>Check-Ins</HeadingPrimary>
      <HeadingSecondary>Click on one of churches below</HeadingSecondary>

      <ChurchList color="checkins" link="/checkins" />
    </Container>
  )
}

export default CheckInsChurchSelect
