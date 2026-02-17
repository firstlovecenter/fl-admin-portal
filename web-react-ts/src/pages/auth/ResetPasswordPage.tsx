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
import { Eye, EyeSlash, CheckCircleFill } from 'react-bootstrap-icons'

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .notOneOf(
      [Yup.ref('currentPassword')],
      'New password must be different from current password'
    )
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
})

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setError('')
    setSuccess(false)

    try {
      await resetPassword({
        email: values.email,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reset password. Please try again.'
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
          <h2 className="text-center mb-4 text-white">Change Password</h2>
          <p className="text-center text-secondary mb-4">
            Enter your current password and choose a new one
          </p>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success" className="d-flex align-items-center">
              <CheckCircleFill className="success-icon me-3" size={24} />
              <div>
                <strong>Password changed successfully!</strong>
                <br />
                Redirecting you to login...
              </div>
            </Alert>
          )}

          <Formik
            initialValues={{
              email: '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleSubmit, isSubmitting, errors, touched }) => (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label className="text-white">Email Address</Form.Label>
                  <Field
                    as={Form.Control}
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    disabled={isSubmitting || success}
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
                  controlId="currentPassword"
                >
                  <Form.Label className="text-white">
                    Current Password
                  </Form.Label>
                  <Field
                    as={Form.Control}
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    placeholder="Enter current password"
                    disabled={isSubmitting || success}
                    className={
                      touched.currentPassword && errors.currentPassword
                        ? 'is-invalid'
                        : touched.currentPassword
                        ? 'is-valid'
                        : ''
                    }
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeSlash size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </span>
                  <ErrorMessage name="currentPassword">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                </Form.Group>

                <Form.Group
                  className="mb-3 form-group-with-icon"
                  controlId="newPassword"
                >
                  <Form.Label className="text-white">New Password</Form.Label>
                  <Field
                    as={Form.Control}
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Create a new password"
                    disabled={isSubmitting || success}
                    className={
                      touched.newPassword && errors.newPassword
                        ? 'is-invalid'
                        : touched.newPassword
                        ? 'is-valid'
                        : ''
                    }
                  />
                  <span
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeSlash size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </span>
                  <ErrorMessage name="newPassword">
                    {(msg) => <small className="text-danger">{msg}</small>}
                  </ErrorMessage>
                  <PasswordStrengthIndicator password={values.newPassword} />
                </Form.Group>

                <Form.Group
                  className="mb-3 form-group-with-icon"
                  controlId="confirmPassword"
                >
                  <Form.Label className="text-white">
                    Confirm New Password
                  </Form.Label>
                  <Field
                    as={Form.Control}
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
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
                  disabled={isSubmitting || success}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Changing password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </Form>
            )}
          </Formik>

          <p className="text-center text-secondary mt-4 mb-0">
            <Link to="/login" className="text-brand">
              Back to Sign In
            </Link>
          </p>
        </div>
      </Container>
    </>
  )
}

export default ResetPasswordPage
