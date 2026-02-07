import React from 'react'
import { useAuth } from 'contexts/AuthContext'
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

  const handleLoginClick = () => {
    window.location.href = '/login'
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
          onClick={handleLoginClick}
        >
          Log In
        </Button>
        {!mobileFullSize && (
          <i
            className="fas fa-sign-in-alt fa-2x d-md-none px-5"
            onClick={handleLoginClick}
          />
        )}
      </Container>
    )
  }

  if (isAuthenticated && location.pathname === '/') {
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
              onClick={() => {
                logout() // clearAuth() handles all storage cleanup
                togglePopup()
              }}
            >
              Log Out
            </Button>
          </>
        </Popup>
      )}

      {!mobileFullSize && (
        <i
          className="fas fa-sign-out-alt fa-2x d-md-none"
          onClick={() => logout()}
        />
      )}
    </Container>
  )
}

export default AuthButton
