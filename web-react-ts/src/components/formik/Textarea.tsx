'use client'

import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import './Formik.css'
import { FormikComponentProps } from './formik-types'

function Textarea(props: FormikComponentProps) {
  const { label, name, ...rest } = props
  return (
    <div>
      {label ? <label className="label">{label}</label> : null}
      <Field
        as="textarea"
        id={name}
        name={name}
        className="form-control textarea"
        rows="4"
        {...rest}
      />
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default Textarea
