import { COUNCIL_SERVICE_RECORDS } from '../../ServicesQueries'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const CouncilBankingSlipSubmission = () => (
  <BankingSlipSubmissionForm
    query={COUNCIL_SERVICE_RECORDS}
    selectChurchFromData={(data) =>
      data?.serviceRecords[0]?.serviceLog?.council?.[0]
    }
    serviceDateLabel="Date of Joint Service"
    successPath="/council/service-details"
    errorListPath="/services/council/banking-slips"
  />
)

export default CouncilBankingSlipSubmission
