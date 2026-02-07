import React, { useEffect, useState } from 'react'
import { getAccessToken, getStoredUser } from './lib/auth-service'
import SimpleLogin from './pages/auth/SimpleLogin'

const SimpleApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has stored auth data
    // If token is expired, AuthContext will handle refresh
    const token = getAccessToken()
    const user = getStoredUser()

    console.log('🔍 SimpleApp: Checking stored auth', {
      hasToken: !!token,
      hasUser: !!user,
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

  if (!isAuthenticated) {
    console.log('🔓 SimpleApp: Not authenticated, showing login')
    return (
      <SimpleLogin
        onLoginSuccess={() => {
          setIsAuthenticated(true)
          window.location.href = '/'
        }}
      />
    )
  }

  console.log('✅ SimpleApp: Authenticated, rendering children')
  return <>{children}</>
}

export default SimpleApp
