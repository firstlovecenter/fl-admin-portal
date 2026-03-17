import { useAuth } from 'contexts/AuthContext'
import { HTMLElement } from 'global-types'
import React from 'react'
import { Skeleton } from 'components/ui/skeleton'
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
    | 'brand'
  className?: string
  button?: boolean | string
  animation?: 'wave' | 'glow'
}

const PlaceholderCustom = (props: PlaceholderCustomProps) => {
  const { isAuthenticated } = useAuth()
  const { loading, children, className } = props

  if (loading || !isAuthenticated) {
    return (
      <Skeleton
        className={`h-6 w-full rounded ${className ?? ''}`}
      />
    )
  }

  return <>{children}</>
}

export default PlaceholderCustom
