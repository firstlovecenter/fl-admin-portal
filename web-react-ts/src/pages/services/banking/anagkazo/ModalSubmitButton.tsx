import { FormikProps } from 'formik'
import { FunctionReturnsVoid } from 'global-types'
import React from 'react'
import { Button } from 'components/ui/button'
import { Loader2 } from 'lucide-react'

type SubmitButtonProps = {
  formik: FormikProps<any>
  children?: React.ReactNode
  onClick?: FunctionReturnsVoid
}

const ModalSubmitButton = (props: SubmitButtonProps) => {
  const { formik } = props

  return (
    <Button
      variant="success"
      type="submit"
      className={`${!formik.isValid && 'invalid'}`}
      disabled={formik.isSubmitting}
    >
      {formik.isSubmitting ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin" />
          <span> Submitting</span>
        </>
      ) : (
        props.children || 'Save Changes'
      )}
    </Button>
  )
}

export default ModalSubmitButton
