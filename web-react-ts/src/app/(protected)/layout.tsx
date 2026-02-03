'use client'

import React, { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAccessToken } from '@/lib/auth-service'
import SplashScreen from '@/lib/page-components/splash-screen/SplashSreen'
import PageNotFound from '@/lib/page-components/page-not-found/PageNotFound'
import AppWithContext from '@/AppWithContext'

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const [token, setToken] = React.useState<string>('')

  React.useEffect(() => {
    if (user) {
      const accessToken = getAccessToken()
      if (accessToken) {
        setToken(accessToken)
      }
    }
  }, [user])

  if (isLoading) {
    return <SplashScreen />
  }

  if (!user) {
    return <PageNotFound />
  }

  if (!token) {
    return <SplashScreen />
  }

  return <AppWithContext token={token}>{children}</AppWithContext>
}
