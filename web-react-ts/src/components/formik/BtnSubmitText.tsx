import React from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const BtnSubmitText = ({ loading }: { loading: boolean }) => {
  const { t } = useTranslation()

  return (
    <div className="inline-flex items-center justify-center gap-2">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('shared.form.submitting')}</span>
        </>
      ) : (
        t('shared.form.confirmYes')
      )}
    </div>
  )
}

export default BtnSubmitText
