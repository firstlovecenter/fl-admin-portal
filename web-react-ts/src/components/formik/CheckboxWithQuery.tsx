'use client'

import React, { useContext } from 'react'
import { Field, ErrorMessage } from 'formik'
import { makeSelectOptions } from '../../global-utils'
import TextError from './TextError/TextError'
import { useQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import './CheckboxGroup.css'
import { FormikWithApolloProps } from './formik-types'
import './Formik.css'
import './CheckboxGroup.css'

interface CheckBoxWithQueryProps extends FormikWithApolloProps {
  modifier: 'filter'

  nestedDataset: string[]
}

function CheckboxWithQuery(props: CheckBoxWithQueryProps) {
  const {
    label,
    name,
    modifier,
    queryVariable,
    optionsQuery,
    varValue,
    dataset,
    nestedDataset,
    ...rest
  } = props

  const { theme } = useContext(MemberContext)
  const { data } = useQuery(optionsQuery, {
    variables: {
      [`${queryVariable}`]: varValue,
    },
  })

  const getOptions = () => {
    if (data && dataset && !data[dataset].length) {
      return []
    }
    if (
      data &&
      nestedDataset &&
      (!data[nestedDataset[0]].length ||
        !data[nestedDataset[0]][0][nestedDataset[1]].length)
    ) {
      return []
    }
    if (data && dataset && !nestedDataset) {
      return makeSelectOptions(data[dataset])
    }

    if (data && nestedDataset) {
      return makeSelectOptions(data[nestedDataset[0]][0][nestedDataset[1]])
    }
    return []
  }

  const options = getOptions()

  return (
    <div>
      {label ? (
        <>
          <label className="label checkbox-label" htmlFor={name}>
            {label}
          </label>
          <br />
        </>
      ) : null}
      {/* <Field as="select" id={name} name={name} {...rest}>
        <option value="" disabled defaultValue>
          {defaultOption}
        </option>
        {options.map((option) => {
          return (
            <option
              key={option.value}
              value={modifier === 'filter' ? option.key : option.value}
            >
              {option.key}
            </option>
          )
        })}
      </Field> */}
      <Field name={name} {...rest}>
        {({ field }: any) => {
          return options?.map((option, index) => {
            return (
              <button
                key={index}
                type="button"
                className={`filter-chips ${theme} ${
                  field.value.includes(option.key) && 'active'
                }`}
              >
                <div key={option.key} className="ml-2">
                  <input
                    className="d-none"
                    type="checkbox"
                    id={option.value}
                    {...field}
                    value={modifier === 'filter' ? option.key : option.value}
                    checked={field.value.includes(option.key)}
                  />
                  <label className="pl-4" htmlFor={option.value}>
                    {option.key}
                  </label>
                </div>
              </button>
            )
          })
        }}
      </Field>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default CheckboxWithQuery
