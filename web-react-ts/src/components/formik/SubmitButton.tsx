import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  disabled?: boolean
}

const SubmitButton = ({
  formik,
  children,
  onClick,
  className,
  disabled,
}: SubmitButtonProps) => {
  const { t } = useTranslation()
  return (
    <Button
      type="submit"
      size="lg"
      className={cn(
        'w-full gap-2 px-8 font-semibold sm:w-auto sm:min-w-64',
        !formik.isValid && 'opacity-65',
        className
      )}
      disabled={formik.isSubmitting || disabled}
      onClick={onClick}
    >
      {formik.isSubmitting ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {t('shared.form.submitting')}
        </>
      ) : (
        children ?? t('shared.form.submit')
      )}
    </Button>
  )
}

export default SubmitButton
