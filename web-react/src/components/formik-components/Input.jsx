import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError'
import './Input.css'
import './Formik.css'
import PlaceholderCustom from 'components/Placeholder'
import { useAuth0 } from '@auth0/auth0-react'

function Input(props) {
  const { label, name, ...rest } = props
  const { isAuthenticated } = useAuth0()

  return (
    <div>
      {label ? (
        <PlaceholderCustom loading={!isAuthenticated}>
          <label className="label" htmlFor={name}>
            {label}
          </label>
        </PlaceholderCustom>
      ) : null}
      <Field id={name} name={name} className="form-control" {...rest} />
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default Input
