'use client'

import { useRef, useState } from 'react'
import type { Cover } from '@/lib/covers'

interface Props {
  covers: Cover[]
}

/**
 * One photo shows as before; several become a swipeable strip with the
 * caption of the current photo underneath. The strip is plain scroll-snap, so
 * touch swiping works natively and the buttons only call scrollTo.
 */
export default function CoverGallery({ covers }: Props) {
  const strip = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)

  if (covers.length === 0) return null

  function go(index: number) {
    const el = strip.current
    if (!el) return
    const target = Math.min(Math.max(index, 0), covers.length - 1)
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' })
  }

  function onScroll() {
    const el = strip.current
    if (!el || !el.clientWidth) return
    setCurrent(Math.round(el.scrollLeft / el.clientWidth))
  }

  if (covers.length === 1) {
    const [cover] = covers
    return (
      <figure className="detail-cover-figure">
        <div className="detail-cover">
          <img src={cover.url} alt={cover.caption} />
        </div>
        {cover.caption && <figcaption>{cover.caption}</figcaption>}
      </figure>
    )
  }

  return (
    <figure className="detail-cover-figure gallery" aria-roledescription="carrousel">
      <div className="detail-cover gallery-frame">
        <div ref={strip} className="gallery-strip" onScroll={onScroll} tabIndex={0}>
          {covers.map((cover, index) => (
            <img
              key={cover.url}
              src={cover.url}
              alt={cover.caption}
              loading={index === 0 ? 'eager' : 'lazy'}
              aria-label={`Photo ${index + 1} sur ${covers.length}`}
            />
          ))}
        </div>
        <button type="button" className="gallery-nav gallery-nav--prev" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Photo précédente">
          ←
        </button>
        <button type="button" className="gallery-nav gallery-nav--next" onClick={() => go(current + 1)} disabled={current === covers.length - 1} aria-label="Photo suivante">
          →
        </button>
      </div>
      <figcaption aria-live="polite">
        <span className="gallery-count">
          {current + 1} / {covers.length}
        </span>
        {covers[current]?.caption}
      </figcaption>
    </figure>
  )
}
