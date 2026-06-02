import SynagoLogo from 'components/SynagoLogo'

type LoadingScreenProps = {
  text?: string
}

const LoadingScreen = ({ text }: LoadingScreenProps) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4">
      <SynagoLogo className="h-16 w-16 text-brand" title="Synago" animated />
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {text ?? 'Loading…'}
      </p>
    </div>
  )
}

export default LoadingScreen
