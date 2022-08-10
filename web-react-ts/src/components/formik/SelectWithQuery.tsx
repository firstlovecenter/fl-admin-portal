import React from 'react'
import { Field, ErrorMessage } from 'formik'
import { makeSelectOptions } from '../../global-utils'
import TextError from './TextError/TextError'
import { useQuery } from '@apollo/client'
import { useAuth0 } from '@auth0/auth0-react'
import PlaceholderCustom from 'components/Placeholder'
import { FormikSelectWithApollo } from './formiik-types'

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
    ...rest
  } = props

  const { data } = useQuery(optionsQuery, {
    variables: {
      [`${queryVariable}`]: varValue,
    },
  })
  const { isAuthenticated } = useAuth0()

  let options
  if (data?.constituencies?.length) {
    options = makeSelectOptions(data.constituencies[0].bacentas)
  } else {
    options = data ? makeSelectOptions(data[dataset ? `${dataset}` : '']) : []
  }

  return (
    <div>
      {label ? (
        <PlaceholderCustom loading={!isAuthenticated}>
          <label className="label" htmlFor={name}>
            {label}
          </label>
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
            <option
              key={option.value}
              value={modifier === 'filter' ? option.key : option.value}
            >
              {option.key}
            </option>
          )
        })}
      </Field>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default SelectWithQuery
