import { STREAM_SERVICE_RECORDS } from '../../ServicesQueries'
import { useTranslation } from 'react-i18next'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const StreamBankingSlipSubmission = () => {
  const { t } = useTranslation()
  return (
    <BankingSlipSubmissionForm
      query={STREAM_SERVICE_RECORDS}
      selectChurchFromData={(data) =>
        data?.serviceRecords[0]?.serviceLog?.stream?.[0]
      }
      serviceDateLabel={t('services.banking.bankingSlip.dateOfJointService')}
      successPath="/stream/service-details"
      errorListPath="/services/stream/banking-slips"
    />
  )
}

export default StreamBankingSlipSubmission
