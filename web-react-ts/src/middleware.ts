import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth checks are handled by ProtectedRoute component and AuthContext
  // This middleware can be extended for additional security checks

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
