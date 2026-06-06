"use client"

import { useState } from "react"
import { CalendarRange, CalendarClock, Target, Mountain, Briefcase } from "lucide-react"
import WeekView      from "./components/WeekView"
import DayView       from "./components/DayView"
import QuarterView   from "./components/QuarterView"
import BucketView    from "./components/BucketView"
import JobView       from "./components/JobView"
import F1Celebration from "./components/F1Celebration"

type View = "week" | "day" | "quarter" | "bucket" | "jobs"

const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "week",    label: "Week",        icon: CalendarRange },
  { id: "day",     label: "Day",         icon: CalendarClock },
  { id: "quarter", label: "Quarter",     icon: Target        },
  { id: "bucket",  label: "Bucket List", icon: Mountain      },
  { id: "jobs",    label: "Job Search",  icon: Briefcase     },
]

export default function Home() {
  const [view, setView] = useState<View>("week")

  return (
    <>
      <F1Celebration />

      {/* ── Header ── */}
      <header className="flex items-center justify-between flex-wrap gap-3 px-5 md:px-9 pt-6 pb-4 max-w-6xl mx-auto">
        <div style={{ marginLeft: "-120px" }}>
          <div className="font-display text-4xl leading-none" style={{ color: "var(--ink)" }}>Atlas</div>
          <div className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>your command center</div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto p-1 rounded-xl"
          style={{ backgroundColor: "rgba(255,253,250,0.7)", border: "1px solid var(--line)" }}
        >
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? "var(--burgundy)" : "transparent",
                  color:           active ? "#fff"            : "var(--ink-soft)",
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* ── Content ── */}
      <main className={view === "day"
        ? "px-4 md:px-6 pb-12 w-[96vw] mx-auto"
        : "px-5 md:px-9 pb-12 max-w-6xl mx-auto"}>
        {view === "week"    ? <WeekView />    :
         view === "day"     ? <DayView />     :
         view === "quarter" ? <QuarterView /> :
         view === "bucket"  ? <BucketView />  :
                              <JobView />}
      </main>
    </>
  )
}
