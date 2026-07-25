import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { login as apiLogin, storeAuth, requestPasswordReset } from 'lib/auth-service'
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import SynagoLogo from 'components/SynagoLogo'

const APP_VERSION = __APP_VERSION__

interface SimpleLoginProps {
  onLoginSuccess?: () => void
}

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-svh flex-col bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
            {/* "Synago" is the product's brand name — never translated */}
            <SynagoLogo className="h-10 w-10 text-brand" title="Synago" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Synago
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('auth.brand.tagline')}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[0_4px_24px_0_rgb(0_0_0/0.08)]">
          {children}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">v{APP_VERSION}</p>
      </div>
    </div>
  )
}

const SimpleLogin = ({ onLoginSuccess }: SimpleLoginProps) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authData = await apiLogin({ email, password })
      storeAuth(authData)
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signIn.genericError'))
    } finally {
      setLoading(false)
    }
  }

  if (showForgot) {
    return (
      <AuthLayout>
        <ForgotPasswordForm
          loading={loading}
          setLoading={setLoading}
          onBack={() => { setShowForgot(false); setError('') }}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('auth.signIn.title')}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t('auth.signIn.subtitle')}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.common.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.common.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.signIn.passwordLabel')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.signIn.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
              aria-label={
                showPassword
                  ? t('auth.signIn.hidePassword')
                  : t('auth.signIn.showPassword')
              }
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="min-h-11 px-1 text-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {t('auth.signIn.forgotPassword')}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full bg-brand hover:bg-brand/90 text-brand-foreground min-h-11"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.signIn.submitting')}
            </>
          ) : (
            t('auth.signIn.submit')
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t('auth.common.helpFooter')}
      </p>
    </AuthLayout>
  )
}

interface ForgotPasswordFormProps {
  loading: boolean
  setLoading: (v: boolean) => void
  onBack: () => void
}

const ForgotPasswordForm = ({ loading, setLoading, onBack }: ForgotPasswordFormProps) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('auth.forgotPassword.genericError')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('auth.forgotPassword.back')}
      </button>

      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t('auth.forgotPassword.subtitle')}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {t('auth.forgotPassword.success')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">{t('auth.common.emailLabel')}</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder={t('auth.common.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || success}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-brand hover:bg-brand/90 text-brand-foreground min-h-11"
          disabled={loading || success}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.forgotPassword.submitting')}
            </>
          ) : (
            t('auth.forgotPassword.submit')
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t('auth.common.helpFooter')}
      </p>
    </>
  )
}

export default SimpleLogin
