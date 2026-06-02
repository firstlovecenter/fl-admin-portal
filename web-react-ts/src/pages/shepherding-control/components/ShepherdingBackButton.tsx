import { ArrowLeft } from 'lucide-react'
import { Button } from 'components/ui/button'

type Props = {
  onBack: () => void
  disabled?: boolean
}

const ShepherdingBackButton = ({ onBack, disabled }: Props) => (
  <Button
    type="button"
    variant="secondary"
    size="lg"
    onClick={onBack}
    disabled={disabled}
    className="min-h-12 min-w-12 gap-2 text-lg"
    aria-label="Back to parent church"
  >
    <ArrowLeft className="size-5" />
    Back
  </Button>
)

export default ShepherdingBackButton
