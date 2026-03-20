import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Form, Button, Alert, Navbar, Spinner } from 'react-bootstrap'
import { Formik, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { requestPasswordReset } from '../../lib/auth-service'
import Logo from '../../assets/flc-logo-small.webp'
import './auth.css'
import { CheckCircleFill } from 'react-bootstrap-icons'

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
})

const ForgotPasswordPage = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    setError('')
    setSuccess(false)

    try {
      await requestPasswordReset(values.email)
      setSuccess(true)
      resetForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send reset email. Please try again.'
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
          <h2 className="text-center mb-4 text-white">Reset Password</h2>
          <p className="text-center text-secondary mb-4">
            Enter your email address and we&apos;ll send you instructions to
            reset your password
          </p>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success" className="d-flex align-items-center">
              <CheckCircleFill className="success-icon me-3" size={24} />
              <div>
                <strong>Password reset instructions sent!</strong>
                <br />
                Check your email for a link to reset your password.
              </div>
            </Alert>
          )}

          <Formik
            initialValues={{ email: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isSubmitting, touched, errors }) => (
              <Form onSubmit={handleSubmit}>
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

                <Button
                  variant="brand"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-brand">
                    Back to Sign In
                  </Link>
                </div>
              </Form>
            )}
          </Formik>

          <p className="text-center text-secondary mt-4 mb-0">
            Need help? Contact your administrator
          </p>
        </div>
      </Container>
    </>
  )
}

export default ForgotPasswordPage
