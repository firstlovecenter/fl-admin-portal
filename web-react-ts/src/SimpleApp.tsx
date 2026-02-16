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

    console.log('🔍 SimpleApp: Checking stored auth', {
      hasToken: !!token,
      hasUser: !!user,
      currentPath,
      isPublicRoute: PUBLIC_AUTH_ROUTES.includes(currentPath),
    })

    // User is authenticated if they have both token and user data
    // AuthContext will handle token refresh if needed
    const authenticated = !!token && !!user

    setIsAuthenticated(authenticated)
  }, [])

  if (isAuthenticated === null) {
    // Loading
    console.log('⏳ SimpleApp: Still in loading state')
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
  const isPublicRoute = PUBLIC_AUTH_ROUTES.includes(currentPath)
  if (!isAuthenticated && !isPublicRoute) {
    console.log(
      '🔓 SimpleApp: Not authenticated and not on public route, showing login'
    )
    return (
      <SimpleLogin
        onLoginSuccess={() => {
          setIsAuthenticated(true)
          window.location.href = '/'
        }}
      />
    )
  }

  console.log('✅ SimpleApp: Allowing access, rendering children')
  return <>{children}</>
}

export default SimpleApp
