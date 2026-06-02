import React from 'react'
import { useAuth } from 'contexts/AuthContext'
import { isPublicAuthRoute } from 'lib/auth-service'
import SimpleLogin from 'pages/auth/SimpleLogin'
import SplashSreen from 'pages/splash-screen/SplashSreen'

const SimpleApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <SplashSreen />
  }

  const isPublicRoute = isPublicAuthRoute(window.location.pathname)

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <SimpleLogin
        onLoginSuccess={() => {
          window.location.href = '/'
        }}
      />
    )
  }

  return <>{children}</>
}

export default SimpleApp
