"use client"

import { useState, useEffect, useRef } from "react"

type Phase = "idle" | "car" | "flag"

export default function F1Celebration() {
  const [phase, setPhase] = useState<Phase>("idle")
  const phaseRef = useRef<Phase>("idle")
  phaseRef.current = phase

  useEffect(() => {
    const trigger = () => {
      if (phaseRef.current !== "idle") return
      setPhase("car")
    }
    window.addEventListener("f1-celebrate", trigger)
    return () => window.removeEventListener("f1-celebrate", trigger)
  }, [])

  useEffect(() => {
    if (phase === "car") {
      const t = setTimeout(() => setPhase("flag"), 1500)
      return () => clearTimeout(t)
    }
    if (phase === "flag") {
      const t = setTimeout(() => setPhase("idle"), 2400)
      return () => clearTimeout(t)
    }
  }, [phase])

  if (phase === "idle") return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden>

      {phase === "car" && (
        <>
          {/* Speed lines */}
          {[
            { top: "44%", w: 72,  opacity: 0.45, delay: "0ms" },
            { top: "47%", w: 110, opacity: 0.55, delay: "18ms" },
            { top: "50%", w: 80,  opacity: 0.40, delay: "6ms" },
          ].map((l, i) => (
            <div
              key={i}
              className="f1-line absolute rounded-full"
              style={{
                top:    l.top,
                left:   0,
                height: 2,
                width:  l.w,
                background: `rgba(122,34,48,${l.opacity})`,
                animationDelay: l.delay,
              }}
            />
          ))}

          {/* Racecar */}
          <div
            className="f1-car absolute select-none"
            style={{ top: "43%", left: 0, fontSize: "4.5rem", lineHeight: 1 }}
          >
            🏎️
          </div>
        </>
      )}

      {phase === "flag" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="f1-flag select-none" style={{ fontSize: "7rem", lineHeight: 1 }}>
            🏁
          </span>
        </div>
      )}
    </div>
  )
}
