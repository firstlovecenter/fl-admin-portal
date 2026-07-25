import React from 'react'
import { useTranslation } from 'react-i18next'
import QuickFactsSelect from './QuickFactsSelect'
import '../QuickFacts.css'

const QuickFactsHeader = () => {
  const { t } = useTranslation()
  return (
    <div className="d-flex justify-content-between page-padding">
      <div></div>
      <div>
        <div className="quick-fact-text">
          {t('directory.quickFacts.title')}
        </div>
        <div className="mx-auto mt-2 fit-content">
          <QuickFactsSelect />
        </div>
      </div>
      <div></div>
    </div>
  )
}

export default QuickFactsHeader
