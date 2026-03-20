import React, { useState } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
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
import { Eye, EyeSlash } from 'react-bootstrap-icons'

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  firstName: Yup.string()
    .min(1, 'First name is required')
    .required('First name is required'),
  lastName: Yup.string()
    .min(1, 'Last name is required')
    .required('Last name is required'),
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

const SignupPage = () => {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setError('')

    try {
      await signup({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      })
      // Redirect to home page after successful signup
      navigate('/')
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create account. Please try again.'
      )
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
          <h2 className="text-center mb-4 text-white">Create Account</h2>
          <p className="text-center text-secondary mb-4">
            Join FLC State of the Flock
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Formik
            initialValues={{
              email: '',
              firstName: '',
              lastName: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleSubmit, isSubmitting, errors, touched }) => (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="firstName">
                  <Form.Label className="text-white">First Name</Form.Label>
                  <Field
                    as={Form.Control}
                    type="text"
                    name="firstName"
                    placeholder="Enter your first name"
                    disabled={isSubmitting}
                    className={
                      touched.firstName && errors.firstName
                        ? 'is-invalid'
                        : touched.firstName
                        ? 'is-valid'
                        : ''
                    }
                  />
                  <ErrorMessage name="firstName">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                </Form.Group>

                <Form.Group className="mb-3" controlId="lastName">
                  <Form.Label className="text-white">Last Name</Form.Label>
                  <Field
                    as={Form.Control}
                    type="text"
                    name="lastName"
                    placeholder="Enter your last name"
                    disabled={isSubmitting}
                    className={
                      touched.lastName && errors.lastName
                        ? 'is-invalid'
                        : touched.lastName
                        ? 'is-valid'
                        : ''
                    }
                  />
                  <ErrorMessage name="lastName">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                </Form.Group>

                <Form.Group className="mb-3" controlId="email">
                  <Form.Label className="text-white">Email Address</Form.Label>
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
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

export default SignupPage
