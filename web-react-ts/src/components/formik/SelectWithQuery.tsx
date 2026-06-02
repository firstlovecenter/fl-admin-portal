import React from 'react'
import { useQuery } from '@apollo/client'
import { ErrorMessage, Field, useField } from 'formik'
import { useAuth } from 'contexts/AuthContext'
import PlaceholderCustom from 'components/Placeholder'
import { Label } from 'components/ui/label'
import { cn } from 'components/lib/utils'
import { makeSelectOptions } from '../../global-utils'
import TextError from './TextError/TextError'
import { selectClassName, SelectShell } from './Select'
import { FormikSelectWithApollo } from './formik-types'
import './Formik.css'

function SelectWithQuery(props: FormikSelectWithApollo) {
  const {
    label,
    name,
    modifier,
    queryVariable,
    optionsQuery,
    varValue,
    dataset,
    defaultOption,
    className,
    ...rest
  } = props

  const { data } = useQuery(optionsQuery, {
    variables: {
      [`${queryVariable}`]: varValue,
    },
  })
  const { isAuthenticated } = useAuth()
  const [, meta] = useField(name)
  const showError = Boolean(meta.touched && meta.error)

  let options
  if (data?.governorships?.length) {
    options = makeSelectOptions(data.governorships[0].bacentas)
  } else {
    options = data ? makeSelectOptions(data[dataset ? `${dataset}` : '']) : []
  }

  return (
    <div className="space-y-1.5">
      {label ? (
        <PlaceholderCustom loading={!isAuthenticated}>
          <Label htmlFor={name}>{label}</Label>
        </PlaceholderCustom>
      ) : null}
      <SelectShell>
        <Field
          as="select"
          id={name}
          name={name}
          aria-invalid={showError || undefined}
          className={cn(selectClassName, className)}
          {...rest}
        >
          <option value="" disabled>
            {defaultOption}
          </option>
          {options?.map((option) => (
            <option
              key={option.value}
              value={modifier === 'filter' ? option.key : option.value}
            >
              {option.key}
            </option>
          ))}
        </Field>
      </SelectShell>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default SelectWithQuery
