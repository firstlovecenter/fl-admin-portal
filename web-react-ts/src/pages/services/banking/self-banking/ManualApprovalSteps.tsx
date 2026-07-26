import { Button } from 'components/ui/button'
import { Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ManualApprovalStepsProps = {
  close: () => void
}

const STEP_KEYS = [
  'services.banking.manualApproval.step1',
  'services.banking.manualApproval.step2',
  'services.banking.manualApproval.step3',
  'services.banking.manualApproval.step4',
  'services.banking.manualApproval.step5',
  'services.banking.manualApproval.step6',
  'services.banking.manualApproval.step7',
] as const

const ManualApprovalSteps = ({ close }: ManualApprovalStepsProps) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-banking/10">
          <Phone className="size-5 text-banking" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t('services.banking.manualApproval.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('services.banking.manualApproval.subtitle')}
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {STEP_KEYS.map((key, index) => (
          <li key={key} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <span className="pt-0.5 text-foreground">{t(key)}</span>
          </li>
        ))}
      </ol>

      <Button onClick={close} size="lg" className="w-full">
        {t('services.banking.manualApproval.gotIt')}
      </Button>
    </div>
  )
}

export default ManualApprovalSteps
