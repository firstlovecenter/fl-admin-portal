import { GOVERNORSHIP_SERVICE_RECORDS } from '../../ServicesQueries'
import { useTranslation } from 'react-i18next'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const GovernorshipBankingSlipSubmission = () => {
  const { t } = useTranslation()
  return (
    <BankingSlipSubmissionForm
      query={GOVERNORSHIP_SERVICE_RECORDS}
      selectChurchFromData={(data) =>
        data?.serviceRecords[0]?.serviceLog?.governorship?.[0]
      }
      serviceDateLabel={t('services.banking.bankingSlip.dateOfJointService')}
      successPath="/governorship/service-details"
      errorListPath="/services/governorship/banking-slips"
    />
  )
}

export default GovernorshipBankingSlipSubmission
