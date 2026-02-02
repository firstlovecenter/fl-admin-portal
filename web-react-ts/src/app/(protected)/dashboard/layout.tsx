'use client'

import { ReactNode } from 'react'
import Navigation from '@/pages/dashboards/Navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
