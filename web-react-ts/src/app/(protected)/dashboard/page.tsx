'use client'

// Example: This template shows how to migrate pages from React Router to Next.js
// Replace this with actual dashboard pages from dashboardRoutes.ts

import { useAuth0 } from '@auth0/auth0-react'
import SplashScreen from '@/pages/splash-screen/SplashSreen'

export default function DashboardPage() {
  const { isLoading } = useAuth0()

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <div className="container-fluid">
      <h1>Dashboard</h1>
      <p>Welcome to the First Love Center Admin Portal</p>
      {/* Add your dashboard content here */}
    </div>
  )
}
