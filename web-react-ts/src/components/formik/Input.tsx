'use client'

import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import './Input.css'
import './Formik.css'
import PlaceholderCustom from 'components/Placeholder'
import { useAuth0 } from '@auth0/auth0-react'
import { FormikComponentProps } from './formik-types'

interface InputProps extends FormikComponentProps {
  type?: 'date' | 'time'
}

function Input(props: InputProps) {
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
