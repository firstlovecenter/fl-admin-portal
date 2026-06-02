import { useAuth } from 'contexts/AuthContext'
import { HTMLElement } from 'global-types'
import React from 'react'
import { cn } from 'components/lib/utils'

type PlaceholderVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'brand'

type PlaceholderCustomProps = {
  loading?: boolean
  children?: React.ReactNode
  xs?: number
  sm?: number
  md?: number
  lg?: number
  as?: HTMLElement
  size?: 'sm' | 'lg'
  variant?: PlaceholderVariant
  className?: string
  button?: boolean | string
  animation?: 'wave' | 'glow'
}

const gridToPercent = (value: number | undefined, fallback: number) => {
  const v = value ?? fallback
  const clamped = Math.max(1, Math.min(12, v))
  return `${(clamped / 12) * 100}%`
}

const sizeToHeight = (size: 'sm' | 'lg' | undefined) => {
  if (size === 'sm') return 'h-3'
  if (size === 'lg') return 'h-5'
  return 'h-4'
}

const PlaceholderCustom = (props: PlaceholderCustomProps) => {
  const { isAuthenticated } = useAuth()
  const { loading, children, as, size, xs, className, button } = props

  if (loading || !isAuthenticated) {
    const width = gridToPercent(xs, 8)
    const height = sizeToHeight(size)

    if (button) {
      return (
        <span
          aria-hidden="true"
          className={cn(
            'inline-block animate-pulse rounded-md bg-muted',
            height,
            className
          )}
          style={{ width }}
        />
      )
    }

    const Wrapper = (as ?? 'div') as keyof JSX.IntrinsicElements

    return (
      <Wrapper className={cn('block', className)}>
        <span
          aria-hidden="true"
          className={cn('inline-block animate-pulse rounded-md bg-muted', height)}
          style={{ width }}
        />
      </Wrapper>
    )
  }

  return <>{children}</>
}

export default PlaceholderCustom
