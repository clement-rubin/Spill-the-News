export { default } from 'next-auth/middleware'

export const config = {
  // Two patterns: the bare "/admin" dashboard route, plus everything under
  // "/admin/" except "/admin/login" itself. A single "/admin/((?!login).*)"
  // pattern would miss the bare "/admin" path (it requires a literal "/admin/"
  // followed by at least one more character), leaving the dashboard unprotected.
  matcher: ['/admin', '/admin/((?!login).*)'],
}
