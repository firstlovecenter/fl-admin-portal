import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const { oversightId } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(OVERSIGHT_ACCOUNT_DASHBOARD, {
    variables: {
      id: oversightId,
    },
  })

  const oversight = data?.oversights[0]
  const churchTypeLabel = oversight?.__typename
    ? t(`shared.churchLevel.${oversight.__typename}`, {
        defaultValue: oversight.__typename,
      })
    : ''

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>{`${oversight?.name ?? ''} ${churchTypeLabel}`.trim()}</HeadingPrimary>
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
            {t('accounts.dashboard.viewCampuses')}
          </Button>
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default OversightDashboard
