import i18next from 'i18next'

// BCP 47 locale to format dates in, per active UI language. The region
// subtag matters and cannot be derived from the language code alone —
// 'en' alone gives US ordering ("July 26, 2026") where this app has always
// shown day-first ("26 July 2026").
//
// This is deliberately NOT used for money. Currency formatting stays on
// 'en-GH' regardless of UI language: cedi amounts follow Ghanaian
// conventions for every user, translated UI or not (see
// `lib/use-currency-formatter.ts`).
export const INTL_LOCALES: Record<string, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
  de: 'de-DE',
}

export const DEFAULT_INTL_LOCALE = INTL_LOCALES.en

export const intlLocaleFor = (language?: string): string => {
  if (!language) return DEFAULT_INTL_LOCALE
  // 'languageOnly' load means i18next hands back 'fr', but a stored
  // preference or navigator value can still be region-tagged ('fr-CA').
  return INTL_LOCALES[language.split('-')[0]] ?? DEFAULT_INTL_LOCALE
}

// Reads the live i18next singleton so the shared date helpers stay
// locale-correct without every call site threading a locale param through
// ~20 pages. Components re-render on language change through their own
// `useTranslation()` subscription, which re-runs these helpers.
//
// Falls back to the default when i18next has not been initialised — pure
// unit tests import the date utils without booting `lib/i18n`.
export const currentIntlLocale = (): string =>
  intlLocaleFor(i18next.resolvedLanguage || i18next.language)
