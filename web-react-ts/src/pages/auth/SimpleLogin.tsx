import React, { useState } from 'react'
import { Container, Form, Button, Alert, Navbar } from 'react-bootstrap'
import { login as apiLogin, storeAuth } from '../../lib/auth-service'
import Logo from '../../assets/flc-logo-small.webp'
import './auth.css'

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
      <Navbar bg="dark">
        <Container>
          <img
            src={Logo}
            height="30"
            className="d-inline-block align-top"
            alt="FirstLove Logo"
          />
        </Container>
      </Navbar>

      <Container className="auth-container">
        <div className="auth-card">
          <h2 className="text-center mb-4 text-white">Sign In</h2>
          <p className="text-center text-secondary mb-4">
            Welcome back to FLC State of the Flock
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="text-white">Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label className="text-white">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Check
                type="checkbox"
                label="Remember me"
                className="text-secondary"
              />
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
              variant="brand"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>

          <p className="text-center text-secondary mt-4">
            Need help? Contact your administrator
          </p>
        </div>
      </Container>
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
      <Navbar bg="dark">
        <Container>
          <img
            src={Logo}
            height="30"
            className="d-inline-block align-top"
            alt="FirstLove Logo"
          />
        </Container>
      </Navbar>

      <Container className="auth-container">
        <div className="auth-card">
          <h2 className="text-center mb-4 text-white">Reset Password</h2>
          <p className="text-center text-secondary mb-4">
            Enter your email and we&apos;ll send reset instructions
          </p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="text-white">Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Button
              variant="brand"
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
          </Form>

          <p className="text-center text-secondary mt-4">
            Need help? Contact your administrator
          </p>
        </div>
      </Container>
    </>
  )
}

export default SimpleLogin
