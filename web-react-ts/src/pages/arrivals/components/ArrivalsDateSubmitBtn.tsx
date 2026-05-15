import React from 'react'
import { AiOutlineSend } from 'react-icons/ai'
import { DotLoader } from 'react-spinners'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'

type SubmitButtonProps = {
  formik: any
}

const ArrivalsDateSubmitBtn = ({ formik }: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      size="lg"
      className={cn(
        'bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90',
        !formik.isValid && 'opacity-65'
      )}
      disabled={formik.isSubmitting}
    >
      {formik.isSubmitting ? (
        <DotLoader size={23} />
      ) : (
        <AiOutlineSend size={23} />
      )}
    </Button>
  )
}

export default ArrivalsDateSubmitBtn
