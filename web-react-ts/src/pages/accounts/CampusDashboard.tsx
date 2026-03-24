import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useContext } from 'react'
import { CAMPUS_ACCOUNT_DASHBOARD } from './accountsGQL'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import HeadingSecondary from 'components/HeadingSecondary'
import './accounts-colors.css'
import { useNavigate } from 'react-router'
import RoleView from 'auth/RoleView'
import { permitArrivals, permitLeaderAdmin } from 'permission-utils'
import AccountBalanceCard from './components/AccountBalanceCard'
import { Button } from 'components/ui/button'

const CampusDashboard = () => {
  const { campusId } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(CAMPUS_ACCOUNT_DASHBOARD, {
    variables: {
      id: campusId,
    },
  })

  const campus = data?.campuses[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <HeadingPrimary>{`${campus?.name} ${campus?.__typename}`}</HeadingPrimary>
        <HeadingSecondary>{campus?.leader.fullName}</HeadingSecondary>

        <AccountBalanceCard church={campus} variant="current-balance" />
        <AccountBalanceCard church={campus} variant="bussing-society" />

        <hr />

        <div className="d-grid gap-2">
          <Button
            variant="secondary"
            className="text-start py-3"
            onClick={() => navigate('/accounts/campus/councils-for-deposits')}
          >
            Update Balances
          </Button>

          <Button
            variant="secondary"
            className="text-start py-3"
            onClick={() => navigate('/accounts/campus/council/view-accounts')}
          >
            View Council Balances
          </Button>
          <RoleView roles={permitLeaderAdmin('Campus')}>
            <Button
              variant="secondary"
              className="text-start py-3"
              onClick={() => navigate('/accounts/campus/approvals')}
            >
              Approvals
            </Button>
          </RoleView>
          <RoleView roles={[...permitArrivals('Campus')]}>
            <Button
              variant="secondary"
              className="text-start py-3"
              onClick={() =>
                navigate('/accounts/campus/councils-for-bussing-expense')
              }
            >
              Weekend Bussing Expense Entry
            </Button>
          </RoleView>
          <RoleView roles={permitLeaderAdmin('Campus')}>
            <Button
              variant="secondary"
              className="text-start py-3"
              onClick={() => navigate('/accounts/campus/transaction-history')}
            >
              Transaction History
            </Button>
          </RoleView>
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default CampusDashboard
