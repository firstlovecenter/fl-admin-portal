import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Form, Button, Alert, Navbar } from 'react-bootstrap'
import { requestPasswordReset } from '../../lib/auth-service'
import Logo from '../../assets/flc-logo-small.webp'
import './auth.css'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess(true)
      setEmail('')
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
            Enter your email address and we&apos;ll send you instructions to
            reset your password
          </p>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success">
              Password reset instructions have been sent to your email. Please
              check your inbox.
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label className="text-white">Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />
            </Form.Group>

            <Button
              variant="brand"
              type="submit"
              className="w-100 mb-3"
              disabled={loading || success}
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-brand">
                Back to Sign In
              </Link>
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

export default ForgotPasswordPage
