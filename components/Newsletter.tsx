'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { OPEN_NEWSLETTER } from './NewsletterButton'

const AUTO_OPEN_DELAY = 6000
const DISMISSED_KEY = 'stn:newsletter-dismissed'

/** sessionStorage throws in some privacy modes; a missing flag is never fatal. */
function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    /* ignore */
  }
}

export default function Newsletter() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const dismiss = useCallback(() => {
    setOpen(false)
    writeDismissed()
  }, [])

  // Auto-open once per session, and stay open whenever a Newsletter button asks.
  useEffect(() => {
    const onAsk = () => {
      setSent(false)
      setOpen(true)
    }
    window.addEventListener(OPEN_NEWSLETTER, onAsk)

    // The admin side is a workspace, not a shop window — it never nags.
    let timer: ReturnType<typeof setTimeout> | undefined
    if (!pathname.startsWith('/admin') && !readDismissed()) {
      timer = setTimeout(() => {
        if (!readDismissed()) setOpen(true)
      }, AUTO_OPEN_DELAY)
    }

    return () => {
      window.removeEventListener(OPEN_NEWSLETTER, onAsk)
      clearTimeout(timer)
    }
  }, [pathname])

  // Escape closes, and the page behind stops scrolling while the dialog is up.
  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, dismiss])

  if (!open) return null

  return (
    <div
      className="nl-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss()
      }}
    >
      <div className="nl-wrap">
        {/* Steam off the cup, rising out of the top of the card. */}
        <span className="nl-smoke" aria-hidden><span /></span>
        <span className="nl-smoke" aria-hidden><span /></span>
        <span className="nl-smoke" aria-hidden><span /></span>

        <div role="dialog" aria-modal="true" aria-label="Newsletter Spill the News" className="nl-dialog">
          <button
            ref={closeRef}
            type="button"
            className="nl-close"
            aria-label="Fermer"
            onClick={dismiss}
          >
            ✕
          </button>

          <div>
            <span className="kicker">La tasse du mercredi</span>
            <h2>Spill dans ta boîte mail</h2>
            <p className="nl-lede">Une infolettre par semaine, le temps d&apos;un thé.</p>
          </div>

          {sent ? (
            <div className="nl-sent">
              <strong>C&apos;est servi ☕</strong>
              <span>Rendez-vous mercredi matin.</span>
            </div>
          ) : (
            <>
              <form
                className="nl-form"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setSubmitting(true)
                  setSubmitError(false)
                  try {
                    const res = await fetch('/api/newsletter', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    })
                    if (!res.ok) throw new Error()
                    setSent(true)
                  } catch {
                    setSubmitError(true)
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                <input
                  type="email"
                  required
                  className="nl-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ton@email.fr"
                  aria-label="Adresse e-mail"
                />
                <button type="submit" className="nl-submit" disabled={submitting}>
                  {submitting ? '…' : "Je m'abonne"}
                </button>
              </form>
              {submitError && (
                <p className="nl-error">Une erreur s&apos;est produite, réessaie.</p>
              )}
              <p className="nl-note">Zéro spam, désabonnement en un clic.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
