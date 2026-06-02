import React from 'react'
import { ErrorMessage, useField } from 'formik'
import { Label } from 'components/ui/label'
import { RadioGroup, RadioGroupItem } from 'components/ui/radio-group'
import { cn } from 'components/lib/utils'
import TextError from './TextError/TextError'
import { FormikComponentProps } from './formik-types'

interface RadioButtonProps extends FormikComponentProps {}

const RadioButtons = ({ label, name, options, className }: RadioButtonProps) => {
  const [field, , helpers] = useField(name)

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label className="font-semibold">{label}</Label> : null}
      <RadioGroup
        value={field.value ?? ''}
        onValueChange={(value) => helpers.setValue(value)}
        onBlurCapture={() => helpers.setTouched(true)}
        name={name}
        className="gap-2"
      >
        {options?.map((option) => {
          const id = `${name}-${option.value}`
          return (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem id={id} value={option.value} />
              <Label htmlFor={id} className="cursor-pointer font-normal">
                {option.key}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default RadioButtons
