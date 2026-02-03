import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Container } from 'react-bootstrap'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'

const AccountsLandingPage = () => {
  return (
    <Container>
      <HeadingPrimary>Council Accounts</HeadingPrimary>
      <HeadingSecondary>Click on one of churches below</HeadingSecondary>

      <ChurchList color="accounts" />
    </Container>
  )
}

export default AccountsLandingPage
