import { Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'

type SubmitButtonProps = {
  formik: {
    isSubmitting: boolean
    isValid: boolean
  }
  children?: React.ReactNode
  onClick?: () => void
  className?: string
}

const SubmitButton = ({ formik, children, onClick, className }: SubmitButtonProps) => (
  <Button
    type="submit"
    size="lg"
    className={cn('w-full gap-2', !formik.isValid && 'opacity-65', className)}
    disabled={formik.isSubmitting}
    onClick={onClick}
  >
    {formik.isSubmitting ? (
      <>
        <Loader2 className="size-4 animate-spin" />
        Submitting…
      </>
    ) : (
      children ?? 'Submit'
    )}
  </Button>
)

export default SubmitButton
