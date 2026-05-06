import { Loader2 } from 'lucide-react'
import logo from 'assets/flc-logo-small.webp'

type LoadingScreenProps = {
  text?: string
}

const LoadingScreen = ({ text }: LoadingScreenProps) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4">
      <img
        src={logo}
        alt="FLC Logo"
        className="h-12 w-auto animate-pulse object-contain opacity-90"
      />
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {text ?? 'Loading…'}
      </p>
    </div>
  )
}

export default LoadingScreen
