'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NewsletterButton from './NewsletterButton'

const links = [
  { href: '/articles', label: 'Articles' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/#apropos', label: 'À propos' },
]

export default function Header() {
  const pathname = usePathname()
  const logoRef = useRef<HTMLImageElement>(null)
  const [hasLogo, setHasLogo] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  // The image can finish failing before hydration attaches onError, so also
  // check the already-settled result once on mount.
  useEffect(() => {
    const img = logoRef.current
    if (img?.complete && img.naturalWidth === 0) setHasLogo(false)
  }, [])

  // A route change means the drawer has done its job.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Escape closes the drawer, matching the popup.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="site-header" data-header>
      <div className="header-bar">
        <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
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

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
        </button>

        <nav className="site-nav" id="site-nav" data-open={menuOpen}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                link.href.startsWith('/#')
                  ? undefined
                  : pathname.startsWith(link.href)
                    ? 'page'
                    : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            className="nav-external"
            href="https://instagram.com/spill.thenews"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Instagram
          </a>
          <NewsletterButton className="nav-cta" onDone={() => setMenuOpen(false)}>
            Newsletter
          </NewsletterButton>
        </nav>
      </div>
    </header>
  )
}
