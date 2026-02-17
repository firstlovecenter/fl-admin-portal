import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import PlaceholderCustom from 'components/Placeholder'
import { useAuth } from 'contexts/AuthContext'
import { FormikSelectProps } from './formik-types'

function Select(props: FormikSelectProps) {
  const { label, name, options, defaultOption, ...rest } = props
  const { isAuthenticated } = useAuth()

  return (
    <div>
      {label ? (
        <PlaceholderCustom loading={!isAuthenticated}>
          <label className="label">{label}</label>
        </PlaceholderCustom>
      ) : null}
      <Field
        as="select"
        id={name}
        name={name}
        className="form-control"
        {...rest}
      >
        <option value="" disabled defaultValue="true">
          {defaultOption}
        </option>
        {options?.map((option) => {
          return (
            <option key={option.value} value={option.value}>
              {option.key}
            </option>
          )
        })}
      </Field>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default Select
