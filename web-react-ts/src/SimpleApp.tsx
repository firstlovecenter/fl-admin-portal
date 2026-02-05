import React, { useEffect, useState } from 'react'
import { getAccessToken } from './lib/auth-service'
import SimpleLogin from './pages/auth/SimpleLogin'

const SimpleApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has a valid token
    const token = getAccessToken()
    console.log('🔍 SimpleApp: Checking auth token', {
      hasToken: !!token,
      token: token?.substring(0, 20) + '...',
    })
    setIsAuthenticated(!!token)
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
