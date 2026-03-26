import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { DISPLAY_FONT } from '@/lib/constants'

export default function LoadingScreen() {
  const containerRef = useRef(null)
  const logoRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(logoRef.current, {
        scale: 1.1,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      })

      gsap.fromTo(textRef.current,
        { opacity: 0.5 },
        { opacity: 1, duration: 0.8, repeat: -1, yoyo: true, ease: 'sine.inOut' }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F9F9F8]"
    >
      <div className="relative flex flex-col items-center">
        <div
          ref={logoRef}
          className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl mb-8"
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 14 4-4" />
            <path d="M3.34 19a10 10 0 1 1 17.32 0" />
          </svg>
        </div>

        <h2
          ref={textRef}
          className="text-xl font-bold text-neutral-900 tracking-tight"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          StudyMatch
        </h2>
        <p className="text-sm text-neutral-400 mt-2 font-medium tracking-wide uppercase">
          Curating your matches...
        </p>
      </div>
    </div>
  )
}
