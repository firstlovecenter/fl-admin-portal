import React from 'react'
import { Link } from 'react-router-dom'
import FourOhFour from 'assets/FourOhFour'
import { Button } from 'components/ui/button'
import { useTranslation } from 'react-i18next'

const PageNotFound = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-32 sm:w-40">
        <FourOhFour className="h-auto w-full" />
      </div>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
        404
      </h1>
      <h2 className="mt-2 text-lg font-semibold text-foreground">
        {t('shared.pageNotFound.heading')}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t('shared.pageNotFound.body')}
      </p>
      <Button asChild className="mt-6">
        <Link to="/">{t('shared.actions.goToDashboard')}</Link>
      </Button>
    </div>
  )
}

export default PageNotFound
