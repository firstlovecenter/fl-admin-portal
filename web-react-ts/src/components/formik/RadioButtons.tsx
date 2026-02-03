import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import { FormikComponentProps } from './formik-types'
import { Form } from 'react-bootstrap'

type RadioButtonProps = FormikComponentProps

const RadioButtons = (props: RadioButtonProps) => {
  const { label, name, options, ...rest } = props

  return (
    <div>
      {label ? (
        <label className="fw-bold" htmlFor={name}>
          {label}
        </label>
      ) : null}
      <Field name={name} className="form-control" {...rest}>
        {({ field }: any) => {
          return options?.map((option) => {
            return (
              <div className="col radio-container pl-0" key={option.key}>
                <Form.Check
                  type="radio"
                  id={option.value}
                  {...field}
                  label={option.key}
                  value={option.value}
                  checked={field.value === option.value}
                />
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
