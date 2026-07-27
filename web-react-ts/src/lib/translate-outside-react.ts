import i18next from 'i18next'

/**
 * `t` for modules that are not React components.
 *
 * `lib/auth-service.ts`, `utils/s3Upload.ts` and the export hooks produce
 * error text that ends up in a toast on an otherwise-translated page, but
 * they are plain modules with no hook to read. They can't use
 * `useTranslation()`, and reaching for the i18next singleton directly is
 * unsafe in two ways this wraps up:
 *
 *  - Before `lib/i18n` runs, `i18next.t` returns `undefined`, not the key —
 *    so an uninitialised caller would surface the literal string "undefined"
 *    to the user. `src/index.tsx` imports `lib/i18n` at module level so the
 *    app always initialises, but unit tests importing these modules on their
 *    own do not.
 *  - A missing key would render as the raw key path.
 *
 * Both cases fall back to the English text the caller already had, which is
 * strictly better than either failure mode. `values` is interpolated into the
 * fallback too, so the placeholders never leak either way.
 */
export const tOutsideReact = (
  key: string,
  fallback: string,
  values?: Record<string, string | number>
): string => {
  const interpolate = (template: string) =>
    values
      ? template.replace(/{{\s*(\w+)\s*}}/g, (whole, name) =>
          name in values ? String(values[name]) : whole
        )
      : template

  if (!i18next.isInitialized) return interpolate(fallback)

  const translated = i18next.t(key, values)
  if (typeof translated !== 'string' || translated === key) {
    return interpolate(fallback)
  }
  return translated
}
