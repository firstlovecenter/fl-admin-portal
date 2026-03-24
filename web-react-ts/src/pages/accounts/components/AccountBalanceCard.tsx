import { CouncilForAccounts } from '../accounts-types'
import '../accounts-colors.css'
import { Card, CardContent } from 'components/ui/card'

const AccountBalanceCard = ({
  church,
  variant,
}: {
  church: CouncilForAccounts
  variant: 'current-balance' | 'bussing-society'
}) => {
  return (
    <Card className={`${variant} mb-2`}>
      <CardContent>
        {variant === 'current-balance' && (
          <div className="d-flex align-items-center text-light">
            <div>Weekday Account Balance</div>
            <div>
              <p className="text-end mb-0 ">
                {(church?.weekdayBalance || 0.0).toLocaleString('en-US')}
              </p>
            </div>
          </div>
        )}
        {variant === 'bussing-society' && (
          <div className="d-flex align-items-center text-light">
            <div>Bussing Society Balance</div>
            <div>
              <p className="text-end mb-0">
                {(church?.bussingSocietyBalance || 0.0).toLocaleString('en-US')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AccountBalanceCard
