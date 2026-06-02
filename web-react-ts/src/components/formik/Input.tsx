import React from 'react'
import { ErrorMessage, Field, useField } from 'formik'
import PlaceholderCustom from 'components/Placeholder'
import { useAuth } from 'contexts/AuthContext'
import { Input as ShadcnInput } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { cn } from 'components/lib/utils'
import TextError from './TextError/TextError'
import { FormikComponentProps } from './formik-types'
import './Formik.css'
import './Input.css'

interface InputProps extends FormikComponentProps {
  type?: string
}

function Input(props: InputProps) {
  const { label, name, className, ...rest } = props
  const { isAuthenticated } = useAuth()
  const [, meta] = useField(name)
  const showError = Boolean(meta.touched && meta.error)

  return (
    <div className="space-y-1.5">
      {label ? (
        <PlaceholderCustom loading={!isAuthenticated}>
          <Label htmlFor={name}>{label}</Label>
        </PlaceholderCustom>
      ) : null}
      <Field
        as={ShadcnInput}
        id={name}
        name={name}
        aria-invalid={showError || undefined}
        className={cn('min-h-11', className)}
        {...rest}
      />
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default Input
