"use client"

import { useState, useEffect } from "react"

export default function F1Celebration() {
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    const handler = () => setTrigger(t => t + 1)
    window.addEventListener("f1-celebrate", handler)
    return () => window.removeEventListener("f1-celebrate", handler)
  }, [])

  if (!trigger) return null

  return (
    <div key={trigger} className="cele-root" aria-hidden>
      <div className="cele-racer">
        <span className="streak s1" />
        <span className="streak s2" />
        <span className="streak s3" />
        <span className="cele-car">🏎️</span>
      </div>
      <div className="cele-flag"><span className="bf">🏁</span></div>
    </div>
  )
}
