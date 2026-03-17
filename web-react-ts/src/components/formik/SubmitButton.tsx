import { Button } from 'components/ui/button'
import { Loader2 } from 'lucide-react'
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Submitting</span>
        </>
      ) : (
        props.children || 'Submit'
      )}
    </Button>
  )
}

export default SubmitButton
