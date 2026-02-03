'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import Popup from '../Popup/Popup'
import { Button, Container, Spinner } from 'react-bootstrap'
import usePopup from 'hooks/usePopup'
import './AuthButton.css'
import { BoxArrowRight } from 'react-bootstrap-icons'

type AuthButtonPropsType = {
  mobileFullSize?: boolean
}
const AuthButton = (props: AuthButtonPropsType) => {
  const { logout, isAuthenticated } = useAuth()
  const { togglePopup, isOpen } = usePopup()
  const { mobileFullSize } = props
  const pathname = usePathname()
  const router = useRouter()

  const handleLogin = () => {
    router.push('/login')
  }

  const handleLogout = () => {
    logout()
    sessionStorage.removeItem('currentUser')
    router.push('/login')
    togglePopup()
  }

  if (!isAuthenticated) {
    return (
      <Container>
        <Button
          variant="brand"
          size="lg"
          className={`auth-button px-5 ${
            !mobileFullSize && `d-none d-md-inline`
          }`}
          onClick={handleLogin}
        >
          Log In
        </Button>
        {!mobileFullSize && (
          <i
            className="fas fa-sign-in-alt fa-2x d-md-none px-5"
            onClick={handleLogin}
          />
        )}
      </Container>
    )
  }

  if (isAuthenticated && pathname === '/') {
    return (
      <div className="text-secondary text-center">
        <p>Please wait while we log you in</p>
        <Spinner animation="grow" />
      </div>
    )
  }

  return (
    <Container>
      <Button
        variant="brand"
        className={`auth-button text-nowrap ${
          !mobileFullSize && `d-none d-md-inline`
        }`}
        onClick={togglePopup}
      >
        Log Out <BoxArrowRight />
      </Button>

      {isOpen && (
        <Popup handleClose={togglePopup}>
          <>
            <b>Confirm Log Out</b>
            <p className="mt-2">Are you sure you want to Log Out?</p>
            <Button
              className={`auth-button mt-3 ${
                !mobileFullSize && `d-none d-md-inline`
              }`}
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </>
        </Popup>
      )}

      {!mobileFullSize && (
        <i
          className="fas fa-sign-out-alt fa-2x d-md-none"
          onClick={handleLogout}
        />
      )}
    </Container>
  )
}

export default AuthButton
