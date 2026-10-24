'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export default function MarketingAnimations({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const els = root.current?.querySelectorAll('[data-animate]')
    els?.forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    })
  }, { scope: root })
  return <div ref={root}>{children}</div>
}
