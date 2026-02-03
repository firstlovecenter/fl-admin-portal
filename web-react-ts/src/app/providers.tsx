'use client'

import React from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import ApolloWrapper from '@/lib/ApolloWrapper'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ApolloWrapper>{children}</ApolloWrapper>
    </AuthProvider>
  )
}
