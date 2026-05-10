import SynagoLogo from 'components/SynagoLogo'

const InitialLoading = ({ text }: { text?: string }) => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4">
      <SynagoLogo className="h-16 w-16 text-brand" title="Synago" animated />
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {text ?? 'Please wait while we log you in'}
      </p>
    </div>
  )
}

export default InitialLoading
