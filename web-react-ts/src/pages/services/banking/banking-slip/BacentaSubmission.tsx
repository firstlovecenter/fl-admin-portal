import { BACENTA_SERVICE_RECORDS } from '../../ServicesQueries'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const BacentaBankingSlipSubmission = () => (
  <BankingSlipSubmissionForm
    query={BACENTA_SERVICE_RECORDS}
    selectChurchFromData={(data) =>
      data?.serviceRecords[0]?.serviceLog?.bacenta?.[0]
    }
    serviceDateLabel="Date of Service"
    successPath="/bacenta/service-details"
    errorListPath="/services/bacenta/banking-slips"
  />
)

export default BacentaBankingSlipSubmission
