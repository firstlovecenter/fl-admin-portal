import { BACENTA_SERVICE_RECORDS } from '../../ServicesQueries'
import { useTranslation } from 'react-i18next'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const BacentaBankingSlipSubmission = () => {
  const { t } = useTranslation()
  return (
    <BankingSlipSubmissionForm
      query={BACENTA_SERVICE_RECORDS}
      selectChurchFromData={(data) =>
        data?.serviceRecords[0]?.serviceLog?.bacenta?.[0]
      }
      serviceDateLabel={t('services.banking.bankingSlip.dateOfService')}
      successPath="/bacenta/service-details"
      errorListPath="/services/bacenta/banking-slips"
    />
  )
}

export default BacentaBankingSlipSubmission
