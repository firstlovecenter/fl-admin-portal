import React from 'react'
import { ErrorMessage, Field, useField } from 'formik'
import { Label } from 'components/ui/label'
import { Textarea as ShadcnTextarea } from 'components/ui/textarea'
import { cn } from 'components/lib/utils'
import TextError from './TextError/TextError'
import { FormikComponentProps } from './formik-types'
import './Formik.css'

function Textarea(props: FormikComponentProps) {
  const { label, name, className, ...rest } = props
  const [, meta] = useField(name)
  const showError = Boolean(meta.touched && meta.error)

  return (
    <div className="space-y-1.5">
      {label ? <Label htmlFor={name}>{label}</Label> : null}
      <Field
        as={ShadcnTextarea}
        id={name}
        name={name}
        rows={4}
        aria-invalid={showError || undefined}
        className={cn('min-h-24 resize-y', className)}
        {...rest}
      />
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default Textarea
