import React from 'react'
import { useTranslation } from 'react-i18next'

const ExpiredNotice = () => {
  const { t } = useTranslation()
  return (
    <div>
      <p>😞</p>
      <h5 className="countdown danger fw-bold ">
        {t('arrivals.bacenta.tooLateToFill')}
      </h5>
      <p>{t('arrivals.countdown.expiredDescription')}</p>
    </div>
  )
}

export default ExpiredNotice
