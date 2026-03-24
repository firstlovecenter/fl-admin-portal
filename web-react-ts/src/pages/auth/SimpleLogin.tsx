import React, { useState } from 'react'
import { login as apiLogin, storeAuth } from '../../lib/auth-service'
import Logo from '../../assets/flc-logo-small.webp'
import './auth.css'
import { Button } from 'components/ui/button'

const APP_VERSION = '8.1.3'

interface SimpleLoginProps {
  onLoginSuccess?: () => void
}

const SimpleLogin = ({ onLoginSuccess }: SimpleLoginProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authData = await apiLogin({ email, password })
      // Store auth data
      storeAuth(authData)

      // Callback or reload
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to login. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (
    e: React.FormEvent,
    forgotEmail: string
  ) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_AUTH_API_URL || ''}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email')
      }

      setError('Password reset instructions sent to your email')
      setShowForgot(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send reset email. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (showForgot) {
    return (
      <ForgotPasswordForm
        onBack={() => setShowForgot(false)}
        onSubmit={handleForgotSubmit}
      />
    )
  }

  return (
    <>
      <nav className="bg-zinc-900 py-3">
        <div>
          <img
            src={Logo}
            height="30"
            className="d-inline-block align-top"
            alt="FirstLove Logo"
          />
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <h2 className="text-center mb-4 text-white">Sign In</h2>
          <p className="text-center text-secondary mb-4">
            Welcome back to FLC State of the Flock
          </p>

          {error && <Alert variant="destructive">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="text-white">Email Address</label>
              <input className="form-control" />
            </div>

            <div className="mb-3">
              <label className="text-white">Password</label>
              <input className="form-control" />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <input type="checkbox" className="form-check-input" />
              <button
                type="button"
                className="btn-link text-brand"
                onClick={() => setShowForgot(true)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>

            <Button
              variant="default"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-secondary mt-4">
            Need help? Contact your administrator
          </p>
          <p
            className="text-center text-muted"
            style={{ fontSize: '0.75rem', marginTop: '1rem' }}
          >
            v{APP_VERSION}
          </p>
        </div>
      </div>
    </>
  )
}

interface ForgotPasswordFormProps {
  onBack: () => void
  onSubmit: (e: React.FormEvent, email: string) => Promise<void>
}

const ForgotPasswordForm = ({ onBack, onSubmit }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true)
    await onSubmit(e, email)
    setLoading(false)
  }

  return (
    <>
      <nav className="bg-zinc-900 py-3">
        <div>
          <img
            src={Logo}
            height="30"
            className="d-inline-block align-top"
            alt="FirstLove Logo"
          />
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <h2 className="text-center mb-4 text-white">Reset Password</h2>
          <p className="text-center text-secondary mb-4">
            Enter your email and we&apos;ll send reset instructions
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="text-white">Email Address</label>
              <input className="form-control" />
            </div>

            <Button
              variant="default"
              type="submit"
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="btn-link text-brand"
                onClick={onBack}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>

          <p className="text-center text-secondary mt-4">
            Need help? Contact your administrator
          </p>
          <p
            className="text-center text-muted"
            style={{ fontSize: '0.75rem', marginTop: '1rem' }}
          >
            v{APP_VERSION}
          </p>
        </div>
      </div>
    </>
  )
}

export default SimpleLogin
