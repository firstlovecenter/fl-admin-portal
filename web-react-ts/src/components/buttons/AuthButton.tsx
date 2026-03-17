import React from 'react'
import { useAuth } from 'contexts/AuthContext'
import Popup from '../Popup/Popup'
import { Button } from 'components/ui/button'
import usePopup from 'hooks/usePopup'
import './AuthButton.css'
import { LogOut } from 'lucide-react'

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
      <div>
        <Button
          variant="default"
          size="lg"
          className={`auth-button px-5 ${
            !mobileFullSize ? `hidden md:inline-flex` : ''
          }`}
          onClick={handleLoginClick}
        >
          Log In
        </Button>
        {!mobileFullSize && (
          <i
            className="fas fa-sign-in-alt fa-2x md:hidden px-5"
            onClick={handleLoginClick}
          />
        )}
      </div>
    )
  }

  if (isAuthenticated && location.pathname === '/') {
    return (
      <div className="text-muted-foreground text-center">
        <p>Please wait while we log you in</p>
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <Button
        variant="default"
        className={`auth-button text-nowrap ${
          !mobileFullSize ? `hidden md:inline-flex` : ''
        }`}
        onClick={togglePopup}
      >
        Log Out <LogOut className="ml-1 h-4 w-4" />
      </Button>

      {isOpen && (
        <Popup handleClose={togglePopup}>
          <>
            <b>Confirm Log Out</b>
            <p className="mt-2">Are you sure you want to Log Out?</p>
            <Button
              className={`auth-button mt-3 ${
                !mobileFullSize ? `hidden md:inline-flex` : ''
              }`}
              onClick={() => {
                logout()
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
          className="fas fa-sign-out-alt fa-2x md:hidden"
          onClick={() => logout()}
        />
      )}
    </div>
  )
}

export default AuthButton
