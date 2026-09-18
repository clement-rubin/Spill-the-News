'use client'

import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function Motion() {
  const pathname = usePathname()

  useGSAP(
    () => {
      // Turns off the CSS reveal fallback now that GSAP owns these elements.
      document.documentElement.classList.add('motion')

      const mm = gsap.matchMedia()

      mm.add(
        {
          reduce: '(prefers-reduced-motion: reduce)',
          full: '(prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          const sections = gsap.utils.toArray<HTMLElement>('[data-reveal]')
          const header = document.querySelector<HTMLElement>('[data-header]')

          if (header) {
            ScrollTrigger.create({
              start: 'top -24px',
              end: 99999,
              onToggle: (self) => header.classList.toggle('is-stuck', self.isActive),
            })
          }

          if (ctx.conditions!.reduce) {
            gsap.set(sections, { opacity: 1, y: 0 })
            return
          }

          // Ticker: the track holds two identical groups, so shifting it by
          // exactly half its width loops seamlessly.
          const ticker = document.querySelector<HTMLElement>('[data-ticker]')
          if (ticker) {
            gsap.to(ticker, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 })
          }

          // Drip edge: two waves sliding at different speeds reads as liquid
          // without morphing path data every frame.
          gsap.to('[data-drip-back]', {
            xPercent: 3,
            duration: 9,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })
          gsap.to('[data-drip-front]', {
            xPercent: -2.5,
            yPercent: 4,
            duration: 7,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          })

          const glow = document.querySelector<HTMLElement>('[data-hero-glow]')
          const hero = document.querySelector<HTMLElement>('[data-hero]')
          let detachGlow: (() => void) | undefined

          if (glow) {
            gsap.to(glow, {
              x: 70,
              y: 40,
              scale: 1.12,
              duration: 13,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
            })

            if (hero && window.matchMedia('(hover: hover)').matches) {
              // quickTo keeps the cursor lean on its own interpolator so it
              // layers over the drift tween instead of fighting it.
              const leanX = gsap.quickTo(glow, 'xPercent', { duration: 0.8, ease: 'power3.out' })
              const leanY = gsap.quickTo(glow, 'yPercent', { duration: 0.8, ease: 'power3.out' })

              const onMove = (event: MouseEvent) => {
                const bounds = hero.getBoundingClientRect()
                leanX(gsap.utils.mapRange(0, bounds.width, -9, 9, event.clientX - bounds.left))
                leanY(gsap.utils.mapRange(0, bounds.height, -7, 7, event.clientY - bounds.top))
              }
              const onLeave = () => {
                leanX(0)
                leanY(0)
              }

              hero.addEventListener('mousemove', onMove)
              hero.addEventListener('mouseleave', onLeave)
              detachGlow = () => {
                hero.removeEventListener('mousemove', onMove)
                hero.removeEventListener('mouseleave', onLeave)
              }
            }
          }

          const mark = document.querySelector<HTMLElement>('[data-brand-mark]')
          const brand = mark?.parentElement
          let detachBrand: (() => void) | undefined

          if (mark && brand) {
            const spin = gsap.to(mark, {
              rotation: 12,
              scale: 1.08,
              duration: 0.4,
              ease: 'power3.out',
              paused: true,
            })
            const enter = () => spin.play()
            const leave = () => spin.reverse()
            brand.addEventListener('mouseenter', enter)
            brand.addEventListener('mouseleave', leave)
            detachBrand = () => {
              brand.removeEventListener('mouseenter', enter)
              brand.removeEventListener('mouseleave', leave)
            }
          }

          sections.forEach((el) => {
            const staggered = el.hasAttribute('data-reveal-stagger')
            const items = staggered ? gsap.utils.toArray<HTMLElement>(':scope > *', el) : [el]

            // The container is what CSS hid, so it has to come back either way.
            if (staggered) gsap.set(el, { opacity: 1 })

            // fromTo, not from: these start hidden in CSS, so from() would read
            // opacity 0 as the end value and animate 0 to 0.
            gsap.fromTo(
              items,
              { y: 18, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
                stagger: 0.07,
                scrollTrigger: { trigger: el, start: 'top 92%', once: true },
              }
            )
          })

          return () => {
            detachBrand?.()
            detachGlow?.()
            header?.classList.remove('is-stuck')
          }
        }
      )

      return () => mm.revert()
    },
    { dependencies: [pathname], revertOnUpdate: true }
  )

  return null
}
