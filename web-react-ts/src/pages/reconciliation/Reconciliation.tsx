import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import React from 'react'
import { useTranslation } from 'react-i18next'

const Reconciliation = () => {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-screen-md px-4">
      <HeadingPrimary>{t('shared.reconciliation.title')}</HeadingPrimary>
      {t('shared.reconciliation.body')}
    </div>
  )
}

export default Reconciliation
