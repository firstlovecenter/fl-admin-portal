import { Loader2 } from 'lucide-react'
import logo from 'assets/flc-logo-small.webp'

const InitialLoading = ({ text }: { text?: string }) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4">
      <img src={logo} alt="FLC Logo" className="h-12 w-auto object-contain" />
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {text ?? 'Please wait while we log you in'}
      </p>
    </div>
  )
}

export default InitialLoading
