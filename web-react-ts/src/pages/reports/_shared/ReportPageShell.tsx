import { type ReactNode } from 'react'

type ReportPageShellProps = {
  title: string
  highlightWord: string
  highlightClassName?: string
  subtitle?: string
  children: ReactNode
}

const ReportPageShell = ({
  title,
  highlightWord,
  highlightClassName = 'text-banking',
  subtitle,
  children,
}: ReportPageShellProps) => {
  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 lg:max-w-6xl lg:px-6 lg:py-8">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}{' '}
              <span className={highlightClassName}>{highlightWord}</span>
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}

export default ReportPageShell
