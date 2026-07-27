import { FormikProps } from 'formik'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'

type SubmitButtonProps = {
  formik: FormikProps<any>
  children?: React.ReactNode
}

const ModalSubmitButton = ({ formik, children }: SubmitButtonProps) => {
  const { t } = useTranslation()
  return (
    <Button
      type="submit"
      className={cn(
        'bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90',
        !formik.isValid && 'opacity-65'
      )}
      disabled={formik.isSubmitting}
    >
      {formik.isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('shared.form.submitting')}</span>
        </>
      ) : (
        children || t('services.banking.tellerSelect.saveChanges')
      )}
    </Button>
  )
}

export default ModalSubmitButton
