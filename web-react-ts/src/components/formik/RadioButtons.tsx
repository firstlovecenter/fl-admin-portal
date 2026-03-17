import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import { FormikComponentProps } from './formik-types'

interface RadioButtonProps extends FormikComponentProps {}

const RadioButtons = (props: RadioButtonProps) => {
  const { label, name, options, ...rest } = props

  return (
    <div>
      {label ? (
        <label className="font-bold" htmlFor={name}>
          {label}
        </label>
      ) : null}
      <Field name={name} className="form-control" {...rest}>
        {({ field }: any) => {
          return options?.map((option) => {
            return (
              <div className="flex items-center gap-2 pl-0 radio-container" key={option.key}>
                <input
                  type="radio"
                  id={option.value}
                  {...field}
                  value={option.value}
                  checked={field.value === option.value}
                  className="h-4 w-4 border border-primary text-primary focus:ring-ring"
                />
                <label htmlFor={option.value} className="text-sm">
                  {option.key}
                </label>
              </div>
            )
          })
        }}
      </Field>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default RadioButtons
