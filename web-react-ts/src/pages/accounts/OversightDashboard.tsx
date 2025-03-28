import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useContext } from 'react'
import { Button, Container } from 'react-bootstrap'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import HeadingSecondary from 'components/HeadingSecondary'
import './accounts-colors.css'
import { useNavigate } from 'react-router'
import AccountBalanceCard from './components/AccountBalanceCard'
import { OVERSIGHT_ACCOUNT_DASHBOARD } from './accountsGQL'

const OversightDashboard = () => {
  const { oversightId } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(OVERSIGHT_ACCOUNT_DASHBOARD, {
    variables: {
      id: oversightId,
    },
  })

  const oversight = data?.oversights[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{`${oversight?.name} ${oversight?.__typename}`}</HeadingPrimary>
        <HeadingSecondary>{oversight?.leader.fullName}</HeadingSecondary>

        <AccountBalanceCard church={oversight} variant="current-balance" />
        <AccountBalanceCard church={oversight} variant="bussing-society" />

        <hr />

        <div className="d-grid gap-2">
          <Button
            variant="secondary"
            className="text-start py-3"
            onClick={() => navigate('/accounts/oversight/view-campuses')}
          >
            View Campuses
          </Button>
        </div>
      </Container>
    </ApolloWrapper>
  )
}

export default OversightDashboard
