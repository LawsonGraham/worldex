import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Only allow access if user has a valid token
      return !!token
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
