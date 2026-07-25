import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from 'lib/i18n'

interface UseLanguageResult {
  language: string
  languages: SupportedLanguage[]
  setLanguage: (code: string) => void
}

const useLanguage = (): UseLanguageResult => {
  const { i18n } = useTranslation()

  return {
    language: i18n.resolvedLanguage || i18n.language || 'en',
    languages: SUPPORTED_LANGUAGES,
    setLanguage: (code: string) => {
      i18n.changeLanguage(code)
    },
  }
}

export default useLanguage
