import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'

const AccountsLandingPage = () => {
  return (
    <div>
      <HeadingPrimary>Council Accounts</HeadingPrimary>
      <HeadingSecondary>Click on one of churches below</HeadingSecondary>

      <ChurchList color="accounts" />
    </div>
  )
}

export default AccountsLandingPage
