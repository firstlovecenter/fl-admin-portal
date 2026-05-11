import { GOVERNORSHIP_SERVICE_RECORDS } from '../../ServicesQueries'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const GovernorshipBankingSlipSubmission = () => (
  <BankingSlipSubmissionForm
    query={GOVERNORSHIP_SERVICE_RECORDS}
    selectChurchFromData={(data) =>
      data?.serviceRecords[0]?.serviceLog?.governorship?.[0]
    }
    serviceDateLabel="Date of Joint Service"
    successPath="/governorship/service-details"
    errorListPath="/services/governorship/banking-slips"
  />
)

export default GovernorshipBankingSlipSubmission
