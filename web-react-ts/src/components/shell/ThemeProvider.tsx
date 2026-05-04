import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'
type ThemePreference = Theme | 'system'

interface ThemeContextValue {
  theme: Theme
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'flc-theme'
const META_THEME_LIGHT = '#fafafa'
const META_THEME_DARK = '#09090b'

const ThemeContext = createContext<ThemeContextValue | null>(null)

const getSystemPreference = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const readStoredPreference = (): ThemePreference => {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

const applyTheme = (theme: Theme) => {
  const html = document.documentElement
  html.setAttribute('data-theme', theme)
  // Keep Bootstrap in sync during the migration period
  html.setAttribute('data-bs-theme', theme)

  // Update PWA theme-color meta for status bar tint on mobile
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute(
      'content',
      theme === 'dark' ? META_THEME_DARK : META_THEME_LIGHT
    )
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference()
  )
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
    getSystemPreference()
  )

  const theme: Theme = preference === 'system' ? systemTheme : preference

  // Sync DOM whenever resolved theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Watch system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, p)
    }
  }

  const toggleTheme = () => {
    setPreference(theme === 'dark' ? 'light' : 'dark')
  }

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference, toggleTheme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, preference]
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
