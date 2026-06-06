"use client"

import { useState } from "react"
import WeekView    from "./components/WeekView"
import DayView     from "./components/DayView"
import QuarterView from "./components/QuarterView"
import BucketView  from "./components/BucketView"
import JobView     from "./components/JobView"
import F1Celebration from "./components/F1Celebration"

type View = "week" | "day" | "quarter" | "bucket" | "jobs"

const TABS: View[] = ["week", "day", "quarter", "bucket", "jobs"]

export default function Home() {
  const [view, setView] = useState<View>("week")

  return (
    <>
      <F1Celebration />

      {/* ── Top bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background:   "rgba(251,246,238,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="max-w-[1150px] mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-baseline gap-2 flex-shrink-0">
            <span
              className="text-[1.05rem] font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-fraunces, serif)", color: "var(--ink)" }}
            >
              Atlas
            </span>
            <span className="text-[0.68rem] hidden sm:inline" style={{ color: "var(--ink-soft)" }}>
              / your command center
            </span>
          </div>

          {/* Nav — scrollable on small screens */}
          <nav className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize flex-shrink-0"
                style={{
                  background: view === v ? "var(--burgundy)" : "transparent",
                  color:      view === v ? "white"           : "var(--ink-soft)",
                }}
              >
                {v}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="pt-14">
        {view === "week"    ? <WeekView />    :
         view === "day"     ? <DayView />     :
         view === "quarter" ? <QuarterView /> :
         view === "bucket"  ? <BucketView />  :
                              <JobView />}
      </main>
    </>
  )
}
