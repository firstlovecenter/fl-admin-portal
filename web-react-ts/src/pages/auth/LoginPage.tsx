import React, { useState } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Formik, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { requestPasswordReset } from 'lib/auth-service'
import Logo from 'assets/flc-logo-small.webp'

const APP_VERSION = '8.1.3'

const loginSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const AuthShell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-svh flex-col bg-background pb-[env(safe-area-inset-bottom)]">
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
          <img src={Logo} alt="FLC Logo" className="h-10 w-10 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            FLC State of the Flock
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Portal for Church Leaders</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[0_4px_24px_0_rgb(0_0_0/0.08)]">
        {children}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">v{APP_VERSION}</p>
    </div>
  </div>
)

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const handleSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: { setSubmitting: (v: boolean) => void }
  ) => {
    setError('')
    try {
      await login({ email: values.email, password: values.password })
      navigate('/')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to login. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (showForgot) {
    return (
      <AuthShell>
        <ForgotForm onBack={() => { setShowForgot(false); setError('') }} />
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Welcome back. Enter your credentials to continue.
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

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit: formikSubmit, isSubmitting }) => (
          <form onSubmit={formikSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Field name="email">
                {({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> }) => (
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    autoComplete="email"
                    inputMode="email"
                  />
                )}
              </Field>
              <ErrorMessage name="email">
                {(msg) => <p className="text-xs text-destructive">{msg}</p>}
              </ErrorMessage>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Field name="password">
                  {({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> }) => (
                    <Input
                      {...field}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                      autoComplete="current-password"
                      className="pr-11"
                    />
                  )}
                </Field>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ErrorMessage name="password">
                {(msg) => <p className="text-xs text-destructive">{msg}</p>}
              </ErrorMessage>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="min-h-11 px-1 text-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-brand-foreground min-h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        )}
      </Formik>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Need help? Contact your administrator
      </p>
    </AuthShell>
  )
}

const ForgotForm = ({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
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
        err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
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
        Back to sign in
      </button>

      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Reset password</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send reset instructions.
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
          Reset instructions sent. Check your email.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email address</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
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
              Sending…
            </>
          ) : (
            'Send reset instructions'
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Need help? Contact your administrator
      </p>
    </>
  )
}

export default LoginPage
