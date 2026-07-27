import { Card, CardContent } from 'components/ui/card'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'

const AccountBlockedMsg = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('accounts.expense.blockedTitlePrefix')}{' '}
          <span className="text-destructive">
            {t('accounts.expense.blockedTitleHighlight')}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('accounts.expense.blockedSubtitle')}
        </p>
      </StickyPageHeader>
      <main className="mx-auto max-w-2xl px-4 py-5 lg:px-6 lg:py-8">
        <Card className="mt-6 overflow-hidden">
          <CardContent className="flex items-start gap-3 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Lock className="size-5 text-destructive" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {t('accounts.expense.blockedHours')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('accounts.expense.blockedComeBack')}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default AccountBlockedMsg
