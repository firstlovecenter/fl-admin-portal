import React, { useState, useEffect } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  Container,
  Form,
  Button,
  Alert,
  Navbar,
  Spinner,
} from 'react-bootstrap'
import { Formik, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import Logo from '../../assets/flc-logo-small.webp'
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator'
import './auth.css'
import { Eye, EyeSlash, CheckCircleFill } from 'react-bootstrap-icons'

// Utility function to decode JWT and extract email
const extractEmailFromToken = (token: string): string | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))

    return decoded.email || null
  } catch (error) {
    console.error('Failed to decode token:', error)
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

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing setup link. Please request a new one.')
      return
    }

    // Extract email from token
    const email = extractEmailFromToken(token)
    if (!email) {
      setError('Invalid setup link. Could not extract email from token.')
      return
    }

    setExtractedEmail(email)
  }, [token])

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    if (!token || !extractedEmail) {
      setError('Invalid or missing setup link. Please request a new one.')
      setSubmitting(false)
      return
    }

    setError('')
    setSuccess(false)

    try {
      await setupPassword({
        email: extractedEmail,
        token,
        password: values.password,
      })
      setSuccess(true)
      // Redirect to home after 2 seconds (setupPassword should auto-login)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err: any) {
      if (err.message?.includes('expired')) {
        setError(
          'This setup link has expired. Please use "Forgot Password" to get a new one.'
        )
      } else if (err.message?.includes('invalid')) {
        setError(
          'Invalid setup link. Please try logging in or use "Forgot Password".'
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to set up password. Please try again.'
        )
      }
    } finally {
      setSubmitting(false)
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
          <h2 className="text-center mb-4 text-white">Set Up Your Password</h2>
          <p className="text-center text-secondary mb-4">
            Complete your account setup by creating a password
          </p>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success" className="d-flex align-items-center">
              <CheckCircleFill className="success-icon me-3" size={24} />
              <div>
                <strong>Password set up successfully!</strong>
                <br />
                Logging you in...
              </div>
            </Alert>
          )}

          <Formik
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleSubmit, isSubmitting, errors, touched }) => (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label className="text-white">Email Address</Form.Label>
                  <div className="p-3 bg-dark border border-secondary rounded text-white">
                    {extractedEmail || 'Loading email...'}
                  </div>
                </Form.Group>

                <Form.Group
                  className="mb-3 form-group-with-icon"
                  controlId="password"
                >
                  <Form.Label className="text-white">Password</Form.Label>
                  <Field
                    as={Form.Control}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a password"
                    disabled={isSubmitting || success}
                    className={
                      touched.password && errors.password
                        ? 'is-invalid'
                        : touched.password
                        ? 'is-valid'
                        : ''
                    }
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </span>
                  <ErrorMessage name="password">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                  <PasswordStrengthIndicator password={values.password} />
                </Form.Group>

                <Form.Group
                  className="mb-3 form-group-with-icon"
                  controlId="confirmPassword"
                >
                  <Form.Label className="text-white">
                    Confirm Password
                  </Form.Label>
                  <Field
                    as={Form.Control}
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    disabled={isSubmitting || success}
                    className={
                      touched.confirmPassword && errors.confirmPassword
                        ? 'is-invalid'
                        : touched.confirmPassword
                        ? 'is-valid'
                        : ''
                    }
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </span>
                  <ErrorMessage name="confirmPassword">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                </Form.Group>

                <Button
                  variant="brand"
                  type="submit"
                  className="w-100 mt-3"
                  disabled={
                    isSubmitting || success || !token || !extractedEmail
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Setting up password...
                    </>
                  ) : (
                    'Set Up Password'
                  )}
                </Button>
              </Form>
            )}
          </Formik>

          <p className="text-center text-secondary mt-4 mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-brand">
              Sign In
            </Link>
          </p>
        </div>
      </Container>
    </>
  )
}

export default SetupPasswordPage
