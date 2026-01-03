import { FormikProps } from 'formik'
import { FunctionReturnsVoid } from 'global-types'
import React from 'react'
import { Button, Spinner } from 'react-bootstrap'

type SubmitButtonProps = {
  formik: FormikProps<{ sheepseekerName: string; sheepseekerSelect: string }>
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
          <Spinner animation="grow" size="sm" />
          <span> Submitting</span>
        </>
      ) : (
        props.children || 'Save Changes'
      )}
    </Button>
  )
}

export default ModalSubmitButton
