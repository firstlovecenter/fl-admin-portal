import { STREAM_SERVICE_RECORDS } from '../../ServicesQueries'
import BankingSlipSubmissionForm from './BankingSlipSubmissionForm'

const StreamBankingSlipSubmission = () => (
  <BankingSlipSubmissionForm
    query={STREAM_SERVICE_RECORDS}
    selectChurchFromData={(data) =>
      data?.serviceRecords[0]?.serviceLog?.stream?.[0]
    }
    serviceDateLabel="Date of Joint Service"
    successPath="/stream/service-details"
    errorListPath="/services/stream/banking-slips"
  />
)

export default StreamBankingSlipSubmission
