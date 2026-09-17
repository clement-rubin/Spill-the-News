import { withAuth } from 'next-auth/middleware'

// The bare `export { default } from 'next-auth/middleware'` does not know
// about the custom sign-in page configured in `authOptions.pages.signIn` —
// it falls back to NextAuth's built-in `/api/auth/signin`. Passing `pages`
// here explicitly makes the middleware redirect to our own `/admin/login`.
export default withAuth({
  pages: { signIn: '/admin/login' },
})

export const config = {
  // Two patterns: the bare "/admin" dashboard route, plus everything under
  // "/admin/" except "/admin/login" itself. A single "/admin/((?!login).*)"
  // pattern would miss the bare "/admin" path (it requires a literal "/admin/"
  // followed by at least one more character), leaving the dashboard unprotected.
  matcher: ['/admin', '/admin/((?!login).*)'],
}
