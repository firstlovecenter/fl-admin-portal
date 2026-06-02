import { Button } from 'components/ui/button'
import { Phone } from 'lucide-react'

type ManualApprovalStepsProps = {
  close: () => void
}

const STEPS = [
  'Dial *170#',
  'Choose Option: 6) Wallet',
  'Choose Option: 3) My Approvals',
  'Enter your MoMo Pin to retrieve your pending approval list',
  'Choose a pending transaction',
  'Choose Option 1 to approve',
  'Tap the button below to continue',
]

const ManualApprovalSteps = ({ close }: ManualApprovalStepsProps) => (
  <div className="space-y-5">
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-banking/10">
        <Phone className="size-5 text-banking" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Manual Approval
        </h2>
        <p className="text-xs text-muted-foreground">
          Approve the transaction from your phone
        </p>
      </div>
    </div>

    <ol className="space-y-3">
      {STEPS.map((step, index) => (
        <li key={step} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="pt-0.5 text-foreground">{step}</span>
        </li>
      ))}
    </ol>

    <Button onClick={close} size="lg" className="w-full">
      Got it
    </Button>
  </div>
)

export default ManualApprovalSteps
