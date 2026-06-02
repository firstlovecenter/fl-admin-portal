import { FormikProps } from 'formik'
import { FunctionReturnsVoid } from 'global-types'
import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'

type SubmitButtonProps = {
  formik: FormikProps<any>
  children?: React.ReactNode
  onClick?: FunctionReturnsVoid
}

const ModalSubmitButton = ({ formik, children, onClick }: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      onClick={onClick}
      className={cn(
        'bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90',
        !formik.isValid && 'opacity-65'
      )}
      disabled={formik.isSubmitting}
    >
      {formik.isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Submitting</span>
        </>
      ) : (
        children || 'Save Changes'
      )}
    </Button>
  )
}

export default ModalSubmitButton
