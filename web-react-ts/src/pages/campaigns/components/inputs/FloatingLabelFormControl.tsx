import React from 'react'
import { FloatingLabel, Form } from 'react-bootstrap'

type FormControlProps = {
  label: string
  value: string
  disabled: boolean
}

function FloatingLabelFormControl({
  label,
  value,
  disabled,
}: FormControlProps) {
  return (
    <FloatingLabel label={label}>
      <Form.Control
        value={value === null ? 0 : value.toLocaleString()}
        disabled={disabled}
      />
    </FloatingLabel>
  )
}

export default FloatingLabelFormControl
