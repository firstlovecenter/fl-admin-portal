import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from 'lib/i18n'

interface UseLanguageResult {
  language: string
  languages: SupportedLanguage[]
  setLanguage: (code: string) => void
}

const useLanguage = (): UseLanguageResult => {
  const { i18n } = useTranslation()

  const setLanguage = useCallback(
    (code: string) => {
      i18n.changeLanguage(code)
    },
    [i18n]
  )

  return {
    language: i18n.resolvedLanguage || i18n.language || 'en',
    languages: SUPPORTED_LANGUAGES,
    setLanguage,
  }
}

export default useLanguage
