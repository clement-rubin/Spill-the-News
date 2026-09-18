'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const TILE_VAR = '--logo-tile'

export default function LogoField() {
  const [ready, setReady] = useState(false)
  const frame = useRef<HTMLDivElement>(null)

  // Only paint the watermark once the logo actually decodes — otherwise a
  // missing public/logo.jpg leaves a field of broken-image tiles.
  useEffect(() => {
    const probe = new window.Image()
    probe.onload = () => setReady(true)
    probe.src = '/logo.jpg'
    return () => {
      probe.onload = null
    }
  }, [])

  useGSAP(
    () => {
      if (!ready) return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tile = gsap.utils.toArray<HTMLElement>('[data-logo-tile]')[0]
        const inner = gsap.utils.toArray<HTMLElement>('[data-logo-parallax]')[0]
        if (!tile) return

        const step = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(TILE_VAR)
        )

        // Travelling exactly one tile means the pattern lands back on itself,
        // so the repeat is seamless however long it runs.
        gsap.to(tile, {
          x: step,
          y: step,
          duration: 34,
          ease: 'none',
          repeat: -1,
        })

        // Slow breathe on opacity only. Scaling or rotating would change the
        // tile geometry and break the seam above.
        gsap.to(tile, {
          opacity: 0.085,
          duration: 7,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })

        if (inner) {
          gsap.to(inner, {
            yPercent: 12,
            ease: 'none',
            scrollTrigger: {
              trigger: document.documentElement,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.6,
            },
          })
        }
      })

      return () => mm.revert()
    },
    { dependencies: [ready], revertOnUpdate: true }
  )

  if (!ready) return null

  return (
    <div className="logo-field" aria-hidden ref={frame}>
      <div className="logo-field-inner" data-logo-parallax>
        <div className="logo-field-tile" data-logo-tile />
      </div>
    </div>
  )
}
