import React, { useState } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Form, Button, Alert, Navbar } from 'react-bootstrap'
import Logo from '../../assets/flc-logo-small.webp'
import './auth.css'

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      // Redirect to home page after successful login
      navigate('/')
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
              <Link to="/forgot-password" className="text-brand">
                Forgot Password?
              </Link>
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

export default LoginPage
