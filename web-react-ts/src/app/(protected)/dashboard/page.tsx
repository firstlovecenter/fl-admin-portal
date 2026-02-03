'use client'

// Example: This template shows how to migrate pages from React Router to Next.js
// Replace this with actual dashboard pages from dashboardRoutes.ts

import { useAuth } from '@/contexts/AuthContext'
import SplashScreen from '@/lib/page-components/splash-screen/SplashSreen'

export default function DashboardPage() {
  const { isLoading } = useAuth()

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
