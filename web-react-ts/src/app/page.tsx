'use client'

import React, { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppWithContext from '@/AppWithContext'
import Login from '@/components/Login'
import SplashScreen from '@/lib/page-components/splash-screen/SplashSreen'
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
  const { isLoading, user } = useAuth()

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
