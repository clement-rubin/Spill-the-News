'use client'

export const OPEN_NEWSLETTER = 'stn:open-newsletter'

interface Props {
  className?: string
  children: React.ReactNode
  onDone?: () => void
}

/**
 * The popup lives once, at the root. Header and footer only need to ask for it,
 * so they fire an event rather than the whole tree sharing state.
 */
export default function NewsletterButton({ className, children, onDone }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(OPEN_NEWSLETTER))
        onDone?.()
      }}
    >
      {children}
    </button>
  )
}
