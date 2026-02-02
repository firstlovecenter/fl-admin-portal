'use client'

import React, { Suspense } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import AppWithContext from '@/AppWithContext'
import Login from '@/components/Login'
import SplashScreen from '@/pages/splash-screen/SplashSreen'
import CacheBuster from '@/CacheBuster'

export default function Page() {
  return (
    <CacheBuster>
      {({
        loading,
        isLatestVersion,
        refreshCacheAndReload,
      }: {
        loading: boolean
        isLatestVersion: boolean
        refreshCacheAndReload: () => void
      }) => {
        if (loading) return null
        if (!loading && !isLatestVersion) {
          refreshCacheAndReload()
        }

        return <AuthWrapper />
      }}
    </CacheBuster>
  )
}

function AuthWrapper() {
  const { isLoading, user } = useAuth0()

  if (isLoading) {
    return <SplashScreen />
  }

  if (!user) {
    return <Login />
  }

  return (
    <Suspense fallback={<SplashScreen />}>
      <AppWithContext token="" />
    </Suspense>
  )
}
