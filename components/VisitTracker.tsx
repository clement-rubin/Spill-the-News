'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isContentPath } from '@/lib/contentPath'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Stats only cover articles and episodes; every other page is ignored.
    if (!isContentPath(pathname)) return

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
