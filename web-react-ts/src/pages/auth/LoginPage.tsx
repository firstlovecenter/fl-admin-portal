import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from 'contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Formik, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { IconArrowLeft, IconArrowNarrowRight } from '@tabler/icons-react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { requestPasswordReset } from 'lib/auth-service'
import { cn } from 'components/lib/utils'
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

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
}

const AuthShell = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background pb-[env(safe-area-inset-bottom)]">
    {/* Ambient brand radial glow — top */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-40 h-[520px]"
      style={{
        background:
          'radial-gradient(ellipse 75% 55% at 50% 0%, hsl(var(--brand) / 0.16) 0%, transparent 72%)',
      }}
    />
    {/* Subtle ambient glow — bottom */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-24 h-64"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 50% 100%, hsl(var(--brand) / 0.07) 0%, transparent 80%)',
      }}
    />
    {/* Grain noise overlay — z-10 keeps it below Radix portals at z-50 */}
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
        opacity: 0.028,
        mixBlendMode: 'overlay',
      }}
    />

    <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-12">
      {/* Logo + branding */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-9 flex flex-col items-center gap-5"
      >
        <motion.div variants={slideUp} className="relative flex items-center justify-center">
          {/* Soft brand halo behind logo */}
          <div
            aria-hidden="true"
            className="absolute rounded-[20px] blur-2xl"
            style={{
              inset: '-12px',
              background: 'hsl(var(--brand) / 0.22)',
            }}
          />
          <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[20px] border border-border bg-card shadow-[0_4px_20px_0_rgb(0_0_0/0.10)] dark:shadow-[0_4px_24px_0_rgb(0_0_0/0.30),inset_0_1px_0_rgb(255_255_255/0.06)]">
            <img src={Logo} alt="First Love Center logo" className="h-10 w-10 object-contain" />
          </div>
        </motion.div>

        <motion.div variants={slideUp} className="text-center">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            FLC State of the Flock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">For church leaders and servants</p>
        </motion.div>
      </motion.div>

      {/* Glass card */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="w-full max-w-[360px]"
      >
        <motion.div
          variants={slideUp}
          className={cn(
            'rounded-2xl border border-border bg-card/90 p-6 backdrop-blur-xl',
            'shadow-[0_8px_32px_0_rgb(0_0_0/0.10)]',
            'dark:bg-card/85 dark:shadow-[0_8px_40px_0_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.04)]'
          )}
        >
          {children}
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="mt-7 text-[11px] text-muted-foreground/60"
      >
        v{APP_VERSION}
      </motion.p>
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
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Sign in</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Enter your credentials to continue.
        </p>
      </div>

      {error && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {error}
        </motion.div>
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
              className="group w-full bg-brand hover:bg-brand/90 text-brand-foreground min-h-11 active:scale-[0.98] active:translate-y-px transition-transform"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <IconArrowNarrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" stroke={2} />
                </>
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
        <IconArrowLeft className="h-4 w-4" stroke={2} />
        Back to sign in
      </button>

      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Reset password</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send reset instructions.
        </p>
      </div>

      {error && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          role="status"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Reset instructions sent. Check your email.
        </motion.div>
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
          className="group w-full bg-brand hover:bg-brand/90 text-brand-foreground min-h-11 active:scale-[0.98] active:translate-y-px transition-transform"
          disabled={loading || success}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send reset instructions
              <IconArrowNarrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" stroke={2} />
            </>
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
