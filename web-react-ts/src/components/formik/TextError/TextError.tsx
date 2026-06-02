import React from 'react'

type TextErrorProps = {
  children?: React.ReactNode
}

const TextError = ({ children }: TextErrorProps) => {
  return (
    <small
      className="error block text-xs font-medium text-destructive"
      role="alert"
    >
      {children}
    </small>
  )
}

export default TextError
