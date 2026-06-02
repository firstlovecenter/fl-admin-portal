import React from 'react'
import { Field, ErrorMessage } from 'formik'
import { useQuery } from '@apollo/client'
import { makeSelectOptions } from '../../global-utils'
import TextError from './TextError/TextError'
import { cn } from 'components/lib/utils'
import { FormikWithApolloProps } from './formik-types'

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
    <div className="space-y-2">
      {label && (
        <label
          className="block text-sm font-semibold text-foreground"
          htmlFor={name}
        >
          {label}
        </label>
      )}
      <Field name={name} {...rest}>
        {({ field }: any) => (
          <div className="flex flex-wrap gap-2">
            {options?.map((option) => {
              const checked = field.value.includes(option.key)
              return (
                <label
                  key={option.key}
                  htmlFor={option.value}
                  className={cn(
                    'inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    checked
                      ? 'border-members bg-members/20 text-members'
                      : 'border-border bg-transparent text-foreground hover:bg-muted'
                  )}
                >
                  <input
                    className="sr-only"
                    type="checkbox"
                    id={option.value}
                    {...field}
                    value={modifier === 'filter' ? option.key : option.value}
                    checked={checked}
                  />
                  {option.key}
                </label>
              )
            })}
          </div>
        )}
      </Field>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default CheckboxWithQuery
