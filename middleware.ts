import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/conta/login', req.url))
      }
    }

    // Driver routes
    if (path.startsWith('/driver')) {
      if (token?.role !== 'DRIVER') {
        return NextResponse.redirect(new URL('/conta/login', req.url))
      }
    }

    // Employee routes
    if (path.startsWith('/employee')) {
      if (token?.role !== 'EMPLOYEE') {
        return NextResponse.redirect(new URL('/conta/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public routes
        if (
          path === '/' ||
          path.startsWith('/cestas') ||
          path.startsWith('/carrinho') ||
          path.startsWith('/checkout') ||
          path.startsWith('/acompanhar') ||
          path.startsWith('/conta') ||
          path.startsWith('/api')
        ) {
          return true
        }

        // Protected routes need token
        if (path.startsWith('/admin') || path.startsWith('/driver') || path.startsWith('/employee')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*', '/employee/:path*'],
}
