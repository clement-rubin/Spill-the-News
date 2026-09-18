'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/articles', label: 'Articles' },
  { href: '/podcast', label: 'Podcast' },
]

export default function Header() {
  const pathname = usePathname()
  const logoRef = useRef<HTMLImageElement>(null)
  const [hasLogo, setHasLogo] = useState(true)

  // The image can finish failing before hydration attaches onError, so also
  // check the already-settled result once on mount.
  useEffect(() => {
    const img = logoRef.current
    if (img?.complete && img.naturalWidth === 0) setHasLogo(false)
  }, [])

  return (
    <header className="site-header" data-header>
      <div className="header-bar">
        <Link href="/" className="brand">
          <span className="brand-mark" data-brand-mark>
            {hasLogo && (
              <img
                ref={logoRef}
                src="/logo.jpg"
                alt=""
                onError={() => setHasLogo(false)}
              />
            )}
          </span>
          <span className="brand-text">Spill the News</span>
        </Link>

        <nav className="site-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <a
            className="nav-external"
            href="https://instagram.com/spill.thenews"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        </nav>
      </div>
    </header>
  )
}
