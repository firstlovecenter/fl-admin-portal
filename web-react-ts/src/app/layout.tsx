import type { Metadata } from 'next'
import React from 'react'
import { Providers } from './providers'
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
