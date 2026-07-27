import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from 'components/ui/button'
import { useTranslation } from 'react-i18next'

export const UnauthMsg = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
        {t('shared.unauthorised.title')}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t('shared.unauthorised.body')}
      </p>
      <Button asChild className="mt-6">
        <Link to="/">{t('shared.actions.goToDashboard')}</Link>
      </Button>
    </div>
  )
}
