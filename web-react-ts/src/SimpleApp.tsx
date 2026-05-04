import React, { useEffect, useState } from 'react'
import {
  getAccessToken,
  getStoredUser,
  isPublicAuthRoute,
} from 'lib/auth-service'
import SimpleLogin from 'pages/auth/SimpleLogin'

const SimpleApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has stored auth data
    // If token is expired, AuthContext will handle refresh
    const token = getAccessToken()
    const user = getStoredUser()

    // User is authenticated if they have both token and user data
    // AuthContext will handle token refresh if needed
    const authenticated = !!token && !!user

    setIsAuthenticated(authenticated)
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  const isPublicRoute = isPublicAuthRoute(window.location.pathname)

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <SimpleLogin
        onLoginSuccess={() => {
          setIsAuthenticated(true)
          window.location.href = '/'
        }}
      />
    )
  }

  return <>{children}</>
}

export default SimpleApp
