import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'components/ui/button'

type Props = {
  onBack: () => void
  disabled?: boolean
}

const ShepherdingBackButton = ({ onBack, disabled }: Props) => {
  const { t } = useTranslation()

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      onClick={onBack}
      disabled={disabled}
      className="min-h-12 min-w-12 gap-2 text-lg"
      aria-label={t('shepherding.backAriaLabel')}
    >
      <ArrowLeft className="size-5" />
      {t('shepherding.back')}
    </Button>
  )
}

export default ShepherdingBackButton
