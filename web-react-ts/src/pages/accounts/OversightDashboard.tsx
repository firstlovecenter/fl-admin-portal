import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import HeadingSecondary from 'components/HeadingSecondary'
import { useNavigate } from 'react-router'
import { Button } from 'components/ui/button'
import { Separator } from 'components/ui/separator'
import AccountBalanceCard from './components/AccountBalanceCard'
import { OVERSIGHT_ACCOUNT_DASHBOARD } from './accountsGQL'
import './accounts-colors.css'

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
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>{`${oversight?.name} ${oversight?.__typename}`}</HeadingPrimary>
        <HeadingSecondary>{oversight?.leader.fullName}</HeadingSecondary>

        <AccountBalanceCard church={oversight} variant="current-balance" />
        <AccountBalanceCard church={oversight} variant="bussing-society" />

        <Separator />

        <div className="grid gap-2">
          <Button
            variant="secondary"
            className="h-auto justify-start py-3 text-left"
            onClick={() => navigate('/accounts/oversight/view-campuses')}
          >
            View Campuses
          </Button>
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default OversightDashboard
