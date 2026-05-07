import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FileSpreadsheet } from 'lucide-react'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { cn } from 'components/lib/utils'

const MEMBERSHIP_PATHS: Record<string, string> = {
  Bacenta: '/download-reports/bacenta/membership',
  Governorship: '/download-reports/governorship/membership',
  Council: '/download-reports/council/membership',
  Stream: '/download-reports/stream/membership',
  Campus: '/download-reports/campus/membership',
  Oversight: '/download-reports/oversight/membership',
}

const getMembershipDownloadPath = (churchType: string | undefined) =>
  MEMBERSHIP_PATHS[churchType ?? ''] ?? null

type ReportCardProps = {
  icon: ReactNode
  title: string
  description: string
  to: string | null
}

const ReportCard = ({ icon, title, description, to }: ReportCardProps) => {
  const navigate = useNavigate()
  const unavailable = to === null

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => { if (to) navigate(to) }}
      className={cn(
        'flex w-full items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors',
        unavailable
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-accent/40 active:scale-[0.99]'
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banking/10 text-banking">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        {unavailable && (
          <p className="mt-1 text-xs text-muted-foreground/70">
            Not available for your current church scope
          </p>
        )}
      </div>
      {!unavailable && (
        <Download className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}

const ReportsPage = () => {
  const { selectedScope } = useChurchRoleScope()
  const membershipPath = getMembershipDownloadPath(selectedScope?.churchType)

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {selectedScope?.churchName && `${selectedScope.churchName} `}
            <span className="text-banking">Reports</span>
          </h1>
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Left — report list */}
          <div className="space-y-6">
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Membership
              </p>
              <div className="space-y-3">
                <ReportCard
                  icon={<FileSpreadsheet className="size-5" />}
                  title="Membership List"
                  description="Export the full membership roster as a CSV file, including contact details and group assignments."
                  to={membershipPath}
                />
              </div>
            </section>
          </div>

          {/* Right — intentional negative space */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </main>
    </div>
  )
}

export default ReportsPage
