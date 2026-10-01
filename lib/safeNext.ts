/**
 * Only a same-origin relative path is a safe post-auth redirect target.
 * "//evil.com" and "https://evil.com" both start with characters that look
 * relative but aren't — reject anything that isn't a single leading slash.
 */
export function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/admin'
}
