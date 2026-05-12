import { Card, CardContent } from 'components/ui/card'
import { Lock } from 'lucide-react'

const AccountBlockedMsg = () => {
  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto max-w-2xl px-4 py-5 lg:px-6 lg:py-8">
        <header className="space-y-3 pr-14 md:pr-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Account is{' '}
            <span className="text-destructive">Locked</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Expense requests can only be submitted while accounts are open.
          </p>
        </header>

        <Card className="mt-6 overflow-hidden">
          <CardContent className="flex items-start gap-3 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Lock className="size-5 text-destructive" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Accounts are open daily from 6 a.m. to 3 p.m.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Come back during those hours to submit a new expense request.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default AccountBlockedMsg
