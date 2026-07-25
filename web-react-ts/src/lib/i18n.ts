import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from 'locales/en.json'
import fr from 'locales/fr.json'
import es from 'locales/es.json'
import pt from 'locales/pt.json'
import de from 'locales/de.json'

export const LANGUAGE_STORAGE_KEY = 'flc-language'

export interface SupportedLanguage {
  code: string
  nativeName: string
}

// Native names are never run through translation — a Portuguese speaker
// finds "Português" in this list regardless of which language the UI is
// currently rendered in. Adding a language is: one more entry here, one
// more resource below, one more locale JSON file.
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'es', nativeName: 'Español' },
  { code: 'pt', nativeName: 'Português' },
  { code: 'de', nativeName: 'Deutsch' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
      de: { translation: de },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((language) => language.code),
    // Resources are bundled at build time (no i18next-http-backend) so the
    // PWA keeps working fully offline — see CLAUDE.md's PWA rules.
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    interpolation: {
      escapeValue: false,
    },
    // Resources are bundled inline (no i18next-http-backend), so init()
    // happens to resolve synchronously today — but nothing above
    // SimpleLogin (the pre-auth entry point) has a Suspense/ErrorBoundary
    // pair. Disable useSuspense explicitly rather than depend on that
    // implicit guarantee (see ADR-017).
    react: {
      useSuspense: false,
    },
  })

const syncDocumentLang = (language: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

syncDocumentLang(i18n.resolvedLanguage || i18n.language || 'en')
i18n.on('languageChanged', syncDocumentLang)

export default i18n
