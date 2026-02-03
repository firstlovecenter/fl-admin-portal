import React from 'react'
import { Button } from 'react-bootstrap'
import { AiOutlineSend } from 'react-icons/ai'
import { DotLoader } from 'react-spinners'

type SubmitButtonProps = {
  formik: any
}

const ArrivalsDateSubmitBtn = (props: SubmitButtonProps) => {
  const { formik } = props

  return (
    <Button
      variant="success"
      type="submit"
      size="lg"
      className={`${!formik.isValid && 'invalid'}`}
      disabled={formik.isSubmitting}
    >
      {formik.isSubmitting ? (
        <>
          <DotLoader size={23} />
        </>
      ) : (
        <AiOutlineSend size={23} />
      )}
    </Button>
  )
}

export default ArrivalsDateSubmitBtn
