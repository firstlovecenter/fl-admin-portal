import { Button, Spinner } from 'react-bootstrap'

type SubmitButtonProps = {
  formik: any
  children?: JSX.Element
  onClick?: () => void
}

const SubmitButton = (props: SubmitButtonProps) => {
  const { formik, ...rest } = props

  return (
    <Button
      variant="success"
      type="submit"
      className={`${!formik.isValid && 'invalid'}`}
      disabled={formik.isSubmitting}
      {...rest}
    >
      {formik.isSubmitting ? (
        <>
          <Spinner animation="grow" size="sm" />
          <span> Submitting</span>
        </>
      ) : (
        props.children || 'Submit'
      )}
    </Button>
  )
}

export default SubmitButton
