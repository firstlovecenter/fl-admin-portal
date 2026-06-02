import React from 'react'
import { cn } from 'components/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
}

type StrengthLevel = 'weak' | 'medium' | 'strong' | 'none'

const calculatePasswordStrength = (password: string): StrengthLevel => {
  if (!password) return 'none'

  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

const strengthConfig: Record<
  Exclude<StrengthLevel, 'none'>,
  { label: string; width: string; color: string }
> = {
  weak: { label: 'Weak', width: 'w-1/3', color: 'bg-destructive' },
  medium: { label: 'Medium', width: 'w-2/3', color: 'bg-warning' },
  strong: { label: 'Strong', width: 'w-full', color: 'bg-success' },
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
}) => {
  const strength = calculatePasswordStrength(password)
  if (strength === 'none') return null

  const config = strengthConfig[strength]

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            config.width,
            config.color
          )}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength:{' '}
        <span className="font-semibold text-foreground">{config.label}</span>
      </p>
    </div>
  )
}

export default PasswordStrengthIndicator
