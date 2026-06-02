import * as React from 'react'
import { cn } from 'components/lib/utils'

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
))
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt = '', src, onError, onLoad, ...props }, ref) => {
  const [status, setStatus] = React.useState<'idle' | 'loaded' | 'error'>(
    'idle'
  )

  React.useEffect(() => {
    setStatus(src ? 'idle' : 'error')
  }, [src])

  if (!src || status === 'error') return null

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onLoad={(e) => {
        setStatus('loaded')
        onLoad?.(e)
      }}
      onError={(e) => {
        setStatus('error')
        onError?.(e)
      }}
      className={cn(
        'absolute inset-0 aspect-square h-full w-full object-cover',
        className
      )}
      {...props}
    />
  )
})
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
