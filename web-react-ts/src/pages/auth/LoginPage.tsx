import React, { useState } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Formik, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import Logo from '../../assets/flc-logo-small.webp'
import './auth.css'
import { Eye, EyeOff } from 'lucide-react'

const APP_VERSION = '8.1.3'

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setError('')

    try {
      await login({ email: values.email, password: values.password })
      // Redirect to home page after successful login
      navigate('/')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to login. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
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

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isSubmitting, touched, errors }) => (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="text-white">Email Address</label>
                  <Field
                    as={Form.Control}
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                    className={
                      touched.email && errors.email
                        ? 'is-invalid'
                        : touched.email
                        ? 'is-valid'
                        : ''
                    }
                  />
                  <ErrorMessage name="email">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                </div>

                <div className="mb-3">
                  <label className="text-white">Password</label>
                  <Field
                    as={Form.Control}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
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
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                  <ErrorMessage name="password">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input type="checkbox" className="form-check-input" />
                  <Link to="/forgot-password" className="text-brand">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  variant="default"
                  type="submit"
                  className="w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            )}
          </Formik>

          <p className="text-center text-secondary mt-4 mb-2">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand">
              Sign Up
            </Link>
          </p>
          <p className="text-center text-secondary mb-0">
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

export default LoginPage
