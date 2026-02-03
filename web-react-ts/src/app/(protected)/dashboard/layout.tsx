'use client'

import { ReactNode } from 'react'
import Navigation from '@/lib/page-components/dashboards/Navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
