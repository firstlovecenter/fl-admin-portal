'use client'

import { useAuth } from '@/contexts/AuthContext'
import { HTMLElement } from 'global-types'
import React from 'react'
import { Placeholder } from 'react-bootstrap'
import '../lib/page-components/services/graphs/Graphs.css'

type PlaceholderCustomProps = {
  loading?: boolean
  children?: React.ReactNode
  xs?: number
  sm?: number
  md?: number
  lg?: number
  as?: HTMLElement
  size?: 'sm' | 'lg'
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'brand'
  className?: string
  button?: boolean | string
  animation?: 'wave' | 'glow'
}

const PlaceholderCustom = (props: PlaceholderCustomProps) => {
  const { isAuthenticated } = useAuth()
  const { loading, children, as, size, xs, ...rest } = props

  if (loading || !isAuthenticated) {
    if (props.button) {
      return (
        <Placeholder.Button
          aria-hidden="true"
          className={props.className}
          variant={props.variant}
          animation="glow"
          {...rest}
        />
      )
    }

    return (
      <>
        <Placeholder as={as ?? 'div'} animation="glow" {...rest}>
          <Placeholder xs={xs ?? 8} size={size ?? 'lg'} bg="dark" />
        </Placeholder>
      </>
    )
  }

  return <>{children}</>
}

export default PlaceholderCustom
