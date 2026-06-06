"use client"

import { useState } from "react"
import WeekView from "./components/WeekView"
import DayView from "./components/DayView"
import QuarterView from "./components/QuarterView"
import BucketView from "./components/BucketView"
import JobView from "./components/JobView"

type View = "week" | "day" | "quarter" | "bucket" | "jobs"

export default function Home() {
  const [view, setView] = useState<View>("week")

  return (
    <div className="min-h-screen" style={{ background: "#0C0A0B" }}>
      <div className="flex items-center justify-center pt-5 gap-1">
        {(["week", "day", "quarter", "bucket", "jobs"] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-5 py-1.5 rounded-full text-sm font-medium transition-all capitalize"
            style={{
              background:  view === v ? "rgba(212,168,83,0.12)" : "transparent",
              color:       view === v ? "#D4A853"                : "rgba(245,240,232,0.35)",
              border:     `1px solid ${view === v ? "rgba(212,168,83,0.4)" : "transparent"}`,
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "week"    ? <WeekView />    :
       view === "day"     ? <DayView />     :
       view === "quarter" ? <QuarterView /> :
       view === "bucket"  ? <BucketView />  :
                            <JobView />}
    </div>
  )
}
