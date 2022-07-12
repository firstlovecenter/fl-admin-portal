import { useAuth0 } from '@auth0/auth0-react'
import { HTMLElement } from 'global-types'
import React from 'react'
import { Placeholder } from 'react-bootstrap'
import '../pages/services/graphs/Graphs.css'

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
  className?: string
  button?: boolean
  animation?: 'wave' | 'glow'
}

const PlaceholderCustom = (props: PlaceholderCustomProps) => {
  const { isAuthenticated } = useAuth0()
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
          <Placeholder
            xs={xs ?? 8}
            size={size ?? 'lg'}
            className="h-100"
            bg="dark"
          />
        </Placeholder>
      </>
    )
  }

  return <>{children}</>
}

export default PlaceholderCustom
