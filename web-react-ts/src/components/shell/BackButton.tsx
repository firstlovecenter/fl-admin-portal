import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'

const STANDALONE_QUERY = '(display-mode: standalone)'

const useIsStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(STANDALONE_QUERY).matches
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(STANDALONE_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isStandalone
}

interface BackButtonProps {
  className?: string
}

export const BackButton = ({ className }: BackButtonProps) => {
  const isStandalone = useIsStandalone()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isStandalone) return null
  // Home page has nowhere meaningful to go back to.
  if (location.pathname === '/') return null

  const handleClick = () => {
    if (location.key === 'default') {
      navigate('/', { replace: true })
    } else {
      navigate(-1)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label="Go back"
      className={cn('h-11 w-11 rounded-full', className)}
    >
      <ChevronLeft className="size-4" />
    </Button>
  )
}
