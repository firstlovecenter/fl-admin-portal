import React from 'react'

interface PasswordStrengthIndicatorProps {
  password: string
}

type StrengthLevel = 'weak' | 'medium' | 'strong' | 'none'

const calculatePasswordStrength = (password: string): StrengthLevel => {
  if (!password) return 'none'

  let strength = 0

  // Length check
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++

  // Character variety checks
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++ // Special characters

  // Determine strength level
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

const getStrengthLabel = (strength: StrengthLevel): string => {
  switch (strength) {
    case 'weak':
      return 'Weak'
    case 'medium':
      return 'Medium'
    case 'strong':
      return 'Strong'
    default:
      return ''
  }
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
}) => {
  const strength = calculatePasswordStrength(password)

  if (strength === 'none') return null

  return (
    <div className="mt-2">
      <div className={`password-strength ${strength}`}>
        <div className="password-strength-bar"></div>
      </div>
      <small className="text-muted mt-1 d-block">
        Password strength:{' '}
        <span className="fw-bold">{getStrengthLabel(strength)}</span>
      </small>
    </div>
  )
}

export default PasswordStrengthIndicator
