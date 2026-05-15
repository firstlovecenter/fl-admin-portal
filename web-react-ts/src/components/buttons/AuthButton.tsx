import React from 'react'
import { useAuth } from 'contexts/AuthContext'
import usePopup from 'hooks/usePopup'
import { Loader2, LogIn, LogOut } from 'lucide-react'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'
import Popup from '../Popup/Popup'

type AuthButtonPropsType = {
  mobileFullSize?: boolean
}

const AuthButton = ({ mobileFullSize }: AuthButtonPropsType) => {
  const { logout, isAuthenticated } = useAuth()
  const { togglePopup, isOpen } = usePopup()

  const handleLoginClick = () => {
    window.location.href = '/login'
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex items-center justify-center gap-3 px-4">
        <Button
          size="lg"
          onClick={handleLoginClick}
          className={cn('px-8', !mobileFullSize && 'hidden md:inline-flex')}
        >
          Log In
        </Button>
        {!mobileFullSize && (
          <Button
            type="button"
            size="icon-lg"
            variant="ghost"
            onClick={handleLoginClick}
            className="md:hidden"
            aria-label="Log in"
          >
            <LogIn className="h-6 w-6" />
          </Button>
        )}
      </div>
    )
  }

  if (isAuthenticated && location.pathname === '/') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <p>Please wait while we log you in</p>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex items-center justify-center gap-3 px-4">
      <Button
        onClick={togglePopup}
        className={cn(
          'whitespace-nowrap px-6',
          !mobileFullSize && 'hidden md:inline-flex'
        )}
      >
        Log Out
        <LogOut className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Popup handleClose={togglePopup}>
          <>
            <b>Confirm Log Out</b>
            <p className="mt-2">Are you sure you want to Log Out?</p>
            <Button
              className={cn(
                'mt-3 px-6',
                !mobileFullSize && 'hidden md:inline-flex'
              )}
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
        <Button
          type="button"
          size="icon-lg"
          variant="ghost"
          onClick={() => logout()}
          className="md:hidden"
          aria-label="Log out"
        >
          <LogOut className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}

export default AuthButton
