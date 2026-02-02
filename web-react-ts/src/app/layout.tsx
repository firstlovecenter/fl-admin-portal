import type { Metadata } from 'next'
import { Auth0Provider } from '@auth0/auth0-react'
import ApolloWrapper from '@/lib/ApolloWrapper'
import React from 'react'
// Global styles
import 'bootstrap/dist/css/bootstrap.min.css'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import '@/color-theme.css'
import '@/index.css'

export const metadata: Metadata = {
  title: 'First Love Center Admin Portal',
  description: 'Church administration portal for First Love Center',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Auth0Provider
          domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ''}
          clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ''}
          redirectUri={
            typeof window !== 'undefined' ? window.location.origin : ''
          }
          audience="https://flcadmin.netlify.app/graphql"
          scope="true"
        >
          <ApolloWrapper>{children}</ApolloWrapper>
        </Auth0Provider>
      </body>
    </html>
  )
}
