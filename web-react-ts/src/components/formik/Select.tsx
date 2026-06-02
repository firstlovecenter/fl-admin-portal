import React from 'react'
import { ErrorMessage, Field, useField } from 'formik'
import { ChevronDown } from 'lucide-react'
import PlaceholderCustom from 'components/Placeholder'
import { useAuth } from 'contexts/AuthContext'
import { Label } from 'components/ui/label'
import { cn } from 'components/lib/utils'
import TextError from './TextError/TextError'
import { FormikSelectProps } from './formik-types'
import './Formik.css'

/* Native <select> styled to match the Shadcn input chrome.
 * Native is preferred on mobile because the OS picker (iOS / Android) gives
 * a far better UX than a custom popover. The Lucide chevron is rendered as
 * an absolute-positioned sibling so it inherits muted-foreground in both
 * light and dark mode.
 */
const selectClassName = cn(
  'flex w-full min-w-0 appearance-none items-center rounded-md border border-input bg-transparent px-3 py-2 pr-9',
  'min-h-11',
  'text-base text-foreground md:text-sm shadow-xs outline-none',
  'transition-[color,box-shadow,border-color]',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'dark:bg-input/30'
)

type SelectShellProps = {
  children: React.ReactNode
  className?: string
}

const SelectShell = ({ children, className }: SelectShellProps) => (
  <div className={cn('relative', className)}>
    {children}
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
  </div>
)

function Select(props: FormikSelectProps) {
  const { label, name, options, defaultOption, className, ...rest } = props
  const { isAuthenticated } = useAuth()
  const [, meta] = useField(name)
  const showError = Boolean(meta.touched && meta.error)

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
            <option key={option.value} value={option.value}>
              {option.key}
            </option>
          ))}
        </Field>
      </SelectShell>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default Select
export { selectClassName, SelectShell }
