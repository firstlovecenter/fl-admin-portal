import React from 'react'
import { Field, ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import { cn } from 'components/lib/utils'
import { FormikComponentProps } from './formik-types'

interface CheckboxGroupProps extends FormikComponentProps {}

function CheckboxGroup(props: CheckboxGroupProps) {
  const { label, name, options, ...rest } = props

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
              const checked = field.value.includes(option.value)
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
                    value={option.value}
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

export default CheckboxGroup
