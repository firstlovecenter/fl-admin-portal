import { COUNCIL_SERVICE_RECORDS } from '../../ServicesQueries'
import { useTranslation } from 'react-i18next'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const CouncilBankingSlipSubmission = () => {
  const { t } = useTranslation()
  return (
    <BankingSlipSubmissionForm
      query={COUNCIL_SERVICE_RECORDS}
      selectChurchFromData={(data) =>
        data?.serviceRecords[0]?.serviceLog?.council?.[0]
      }
      serviceDateLabel={t('services.banking.bankingSlip.dateOfJointService')}
      successPath="/council/service-details"
      errorListPath="/services/council/banking-slips"
    />
  )
}

export default CouncilBankingSlipSubmission
