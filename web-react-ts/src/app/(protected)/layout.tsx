'use client'

import React, { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import SplashScreen from '@/pages/splash-screen/SplashSreen'
import PageNotFound from '@/pages/page-not-found/PageNotFound'
import AppWithContext from '@/AppWithContext'

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, getIdTokenClaims } = useAuth0()
  const [token, setToken] = React.useState<string>('')

  React.useEffect(() => {
    if (user) {
      getIdTokenClaims().then((claims) => {
        if (claims?.__raw) {
          setToken(claims.__raw)
        }
      })
    }
  }, [user, getIdTokenClaims])

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
