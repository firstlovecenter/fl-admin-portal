import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Formik, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import PasswordStrengthIndicator from 'components/auth/PasswordStrengthIndicator'
import SynagoLogo from 'components/SynagoLogo'

const APP_VERSION = '8.1.3'

const extractEmailFromToken = (token: string): string | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = JSON.parse(atob(parts[1]))
    return decoded.email || null
  } catch {
    return null
  }
}

const validationSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
})

const SetupPasswordPage = () => {
  const { setupPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [extractedEmail, setExtractedEmail] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing setup link. Please request a new one.')
      return
    }
    const email = extractEmailFromToken(token)
    if (!email) {
      setError('Invalid setup link. Could not extract email from token.')
      return
    }
    setExtractedEmail(email)
  }, [token])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleSubmit = async (
    values: { password: string; confirmPassword: string },
    { setSubmitting }: { setSubmitting: (v: boolean) => void }
  ) => {
    if (!token || !extractedEmail) {
      setError('Invalid or missing setup link. Please request a new one.')
      setSubmitting(false)
      return
    }
    setError('')
    setSuccess(false)
    try {
      await setupPassword({ email: extractedEmail, token, password: values.password })
      setSuccess(true)
      timerRef.current = setTimeout(() => navigate('/'), 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('expired')) {
        setError('This setup link has expired. Please use "Forgot Password" to get a new one.')
      } else if (message.includes('invalid')) {
        setError('Invalid setup link. Please try logging in or use "Forgot Password".')
      } else {
        setError(message || 'Failed to set up password. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
            <SynagoLogo className="h-10 w-10 text-brand" title="Synago" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Synago
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Portal for Church Leaders</p>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[0_4px_24px_0_rgb(0_0_0/0.08)]">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">Set up your password</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Complete your account setup by creating a password.
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
              <span>
                <strong>Password set successfully!</strong> Logging you in…
              </span>
            </div>
          )}

          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleSubmit: formikSubmit, isSubmitting }) => (
              <form onSubmit={formikSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label>Email address</Label>
                  <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {extractedEmail ?? 'Loading email…'}
                  </div>
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
                          placeholder="Create a password"
                          disabled={isSubmitting || success}
                          autoComplete="new-password"
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
                  <PasswordStrengthIndicator password={values.password} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Field name="confirmPassword">
                      {({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> }) => (
                        <Input
                          {...field}
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          disabled={isSubmitting || success}
                          autoComplete="new-password"
                          className="pr-11"
                        />
                      )}
                    </Field>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <ErrorMessage name="confirmPassword">
                    {(msg) => <p className="text-xs text-destructive">{msg}</p>}
                  </ErrorMessage>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand/90 text-brand-foreground min-h-11"
                  disabled={isSubmitting || success || !token || !extractedEmail}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up password…
                    </>
                  ) : (
                    'Set up password'
                  )}
                </Button>
              </form>
            )}
          </Formik>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">v{APP_VERSION}</p>
      </div>
    </div>
  )
}

export default SetupPasswordPage
