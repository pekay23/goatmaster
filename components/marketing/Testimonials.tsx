'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

const items = [
  { name: 'Alice', text: 'GoatMaster changed our farm.' },
  { name: 'Bob', text: 'Best herd tool we have used.' },
  { name: 'Carol', text: 'Simple and powerful.' },
]

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const track = ref.current?.querySelector('.track') as HTMLElement
    if (!track) return
    gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: { trigger: ref.current, start: 'top top', end: () => `+=${track.scrollWidth}`, scrub: 1, pin: true },
    })
  }, { scope: ref })
  return (
    <section ref={ref} className="overflow-hidden h-screen flex items-center">
      <div className="track flex gap-8 px-8">
        {items.map((it) => (
          <div key={it.name} data-animate className="min-w-[320px] p-8 bg-[#F5F0E1] rounded-lg">
            <p className="text-lg">{it.text}</p>
            <p className="mt-4 font-bold">— {it.name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
