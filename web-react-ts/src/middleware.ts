import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, we're relying on Auth0Provider for auth checks
  // This middleware can be extended for additional security checks

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
