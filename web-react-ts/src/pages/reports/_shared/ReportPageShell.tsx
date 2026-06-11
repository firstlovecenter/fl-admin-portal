import { type ReactNode } from 'react'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

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
      <StickyPageHeader>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title} <span className={highlightClassName}>{highlightWord}</span>
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </StickyPageHeader>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-5 lg:max-w-6xl lg:px-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}

export default ReportPageShell
