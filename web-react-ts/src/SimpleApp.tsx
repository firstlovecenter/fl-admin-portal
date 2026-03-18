import React, { useEffect, useState } from 'react'
import { getAccessToken, getStoredUser } from './lib/auth-service'
import SimpleLogin from './pages/auth/SimpleLogin'

// Public routes that don't require authentication
const PUBLIC_AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/setup-password',
]

const SimpleApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has stored auth data
    // If token is expired, AuthContext will handle refresh
    const token = getAccessToken()
    const user = getStoredUser()
    const currentPath = window.location.pathname

    // User is authenticated if they have both token and user data
    // AuthContext will handle token refresh if needed
    const authenticated = !!token && !!user

    setIsAuthenticated(authenticated)
  }, [])

  if (isAuthenticated === null) {
    // Loading
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#1a1a1a',
          color: 'white',
        }}
      >
        <p>Loading...</p>
      </div>
    )
  }

  // Allow access to public auth routes even if not authenticated
  const currentPath = window.location.pathname

  // Normalize path for comparison (remove trailing slashes for comparison)
  const normalizedPath = currentPath.replace(/\/$/, '') || '/'
  const isPublicRoute = PUBLIC_AUTH_ROUTES.some((route) => {
    const normalizedRoute = route.replace(/\/$/, '') || '/'
    return normalizedPath === normalizedRoute
  })

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
