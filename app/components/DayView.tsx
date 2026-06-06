"use client"

import { useState, useEffect } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Work" | "Personal" | "Health" | "Social" | "Focus"

interface EventItem {
  id: number
  date: string
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  title: string
  category: Category
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ["Work", "Personal", "Health", "Social", "Focus"]

const CAT_COLORS: Record<Category, string> = {
  Work:     "#8A2436",
  Personal: "#4A6C8C",
  Health:   "#5B7B5A",
  Social:   "#B5663F",
  Focus:    "#B0823C",
}

const GRID_START = 7   // 7 AM
const GRID_END   = 22  // 10 PM
const HOUR_H     = 64  // px per hour

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDay(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function mins(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

function timeToY(t: string): number {
  return (mins(t) - GRID_START * 60) * (HOUR_H / 60)
}

function durationPx(start: string, end: string): number {
  return Math.max(28, (mins(end) - mins(start)) * (HOUR_H / 60))
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM"
  if (h === 12)            return "12 PM"
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function pad2(n: number): string { return String(n).padStart(2, "0") }

// Greedy column layout for overlapping events
function computeLayout(events: EventItem[]): Map<number, { leftPct: number; widthPct: number }> {
  const result = new Map<number, { leftPct: number; widthPct: number }>()
  if (!events.length) return result

  const sorted = [...events].sort((a, b) => mins(a.startTime) - mins(b.startTime))
  const colEnds: number[] = [] // end-minute of the last event in each column

  for (const e of sorted) {
    const start = mins(e.startTime)
    const end   = mins(e.endTime)
    let col = colEnds.findIndex(endMin => endMin <= start)
    if (col === -1) col = colEnds.length
    colEnds[col] = end
    result.set(e.id, { leftPct: col, widthPct: -1 }) // widthPct filled below
  }

  const totalCols = colEnds.length
  result.forEach((v, id) => {
    result.set(id, { leftPct: (v.leftPct / totalCols) * 100, widthPct: (1 / totalCols) * 100 - 0.4 })
  })
  return result
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DayView() {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [events,      setEvents]      = useState<EventItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [newTitle,    setNewTitle]    = useState("")
  const [newStart,    setNewStart]    = useState("09:00")
  const [newEnd,      setNewEnd]      = useState("10:00")
  const [newCategory, setNewCategory] = useState<Category>("Work")
  const [timeY,       setTimeY]       = useState<number | null>(null)

  const isToday = toDateStr(currentDate) === toDateStr(new Date())

  // ─── Load events ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    fetch(`/api/events?date=${toDateStr(currentDate)}`)
      .then(r => r.json())
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [currentDate])

  // ─── Current-time indicator ─────────────────────────────────────────────────

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h   = now.getHours() + now.getMinutes() / 60
      setTimeY(h >= GRID_START && h <= GRID_END ? (h - GRID_START) * HOUR_H : null)
    }
    update()
    const t = setInterval(update, 60_000)
    return () => clearInterval(t)
  }, [])

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const prevDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const nextDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCurrentDate(d) }

  // ─── Add event ───────────────────────────────────────────────────────────────

  const addEvent = async () => {
    if (!newTitle.trim()) return
    const event: EventItem = await fetch("/api/events", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: toDateStr(currentDate),
        startTime: newStart,
        endTime:   newEnd,
        title:     newTitle.trim(),
        category:  newCategory,
      }),
    }).then(r => r.json())
    setEvents(es => [...es, event])
    closeForm()
  }

  const closeForm = () => {
    setShowForm(false)
    setNewTitle("")
    setNewStart("09:00")
    setNewEnd("10:00")
    setNewCategory("Work")
  }

  // ─── Delete event ────────────────────────────────────────────────────────────

  const deleteEvent = async (id: number) => {
    setEvents(es => es.filter(e => e.id !== id))
    await fetch(`/api/events/${id}`, { method: "DELETE" })
  }

  // ─── Grid click → prefill form ──────────────────────────────────────────────

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect  = e.currentTarget.getBoundingClientRect()
    const y     = e.clientY - rect.top
    const total = (y / HOUR_H) * 60 + GRID_START * 60
    const h     = Math.min(GRID_END - 1, Math.max(GRID_START, Math.floor(total / 60)))
    const m     = Math.round((total % 60) / 15) * 15
    const mSafe = m >= 60 ? 0 : m
    const hEnd  = m >= 60 ? Math.min(GRID_END, h + 2) : Math.min(GRID_END, h + 1)
    setNewStart(`${pad2(h)}:${pad2(mSafe)}`)
    setNewEnd(`${pad2(hEnd)}:${pad2(mSafe)}`)
    setShowForm(true)
  }

  // ─── Layout ──────────────────────────────────────────────────────────────────

  const layout = computeLayout(events)
  const HOUR_LABELS = Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => GRID_START + i)

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-[#F5F0E8]" style={{ background: "#0C0A0B" }}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={prevDay} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-wide">{formatDay(currentDate)}</h1>
            </div>
            <button onClick={nextDay} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
            {!isToday && (
              <button onClick={goToday} className="text-xs px-3 py-1 rounded-full border transition-colors" style={{ borderColor: "rgba(212,168,83,0.4)", color: "#D4A853" }}>
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full transition-colors"
            style={{ background: "rgba(212,168,83,0.12)", border: "1px solid rgba(212,168,83,0.35)", color: "#D4A853" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add block
          </button>
        </div>

        {/* ── Color legend ── */}
        <div className="flex items-center gap-5 flex-wrap">
          {CATEGORIES.map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[cat] }} />
              <span className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>{cat}</span>
            </div>
          ))}
        </div>

        {/* ── Time grid ── */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: "72vh" }}>
            <div className="flex">

              {/* Time labels */}
              <div className="flex-shrink-0 w-16 select-none">
                {HOUR_LABELS.map(h => (
                  <div
                    key={h}
                    className="flex items-start justify-end pr-3"
                    style={{ height: h < GRID_END ? HOUR_H : 24, paddingTop: 2 }}
                  >
                    <span className="text-[11px]" style={{ color: "rgba(245,240,232,0.3)" }}>
                      {formatHour(h)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Events column */}
              <div
                className="flex-1 relative cursor-crosshair"
                style={{ height: (GRID_END - GRID_START) * HOUR_H }}
                onClick={handleGridClick}
              >
                {/* Hour grid lines */}
                {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full"
                    style={{ top: i * HOUR_H, height: 1, background: "rgba(255,255,255,0.06)" }}
                  />
                ))}

                {/* Half-hour lines */}
                {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                  <div
                    key={`h${i}`}
                    className="absolute w-full"
                    style={{ top: i * HOUR_H + HOUR_H / 2, height: 1, background: "rgba(255,255,255,0.03)" }}
                  />
                ))}

                {/* Current time indicator */}
                {isToday && timeY !== null && (
                  <div
                    className="absolute w-full flex items-center pointer-events-none z-20"
                    style={{ top: timeY - 1 }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 -ml-1.5" style={{ background: "#F87171" }} />
                    <div className="flex-1 h-px" style={{ background: "rgba(248,113,113,0.7)" }} />
                  </div>
                )}

                {/* Event blocks */}
                {!loading && events.map(event => {
                  const pos    = layout.get(event.id) ?? { leftPct: 0, widthPct: 99.6 }
                  const top    = timeToY(event.startTime)
                  const height = durationPx(event.startTime, event.endTime)
                  const color  = CAT_COLORS[event.category]
                  return (
                    <div
                      key={event.id}
                      className="absolute rounded-md overflow-hidden group select-none"
                      style={{
                        top,
                        height,
                        left:    `${pos.leftPct}%`,
                        width:   `${pos.widthPct}%`,
                        background: color + "CC",
                        borderLeft: `3px solid ${color}`,
                        padding:    "3px 6px",
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="text-[12px] font-semibold leading-tight text-[#F5F0E8] truncate">{event.title}</p>
                      {height > 40 && (
                        <p className="text-[10px] text-[#F5F0E8] opacity-60 mt-0.5">
                          {event.startTime} – {event.endTime}
                        </p>
                      )}
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity text-white text-xs"
                        style={{ background: "rgba(0,0,0,0.3)" }}
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Add Event Modal ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={closeForm}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: "#1A1215", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-[#F5F0E8]">Add Block</h2>

            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addEvent()}
              placeholder="Block title…"
              className="w-full rounded-lg px-3 py-2 text-sm text-[#F5F0E8] outline-none placeholder-white/25"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] opacity-40 mb-1">Start</p>
                <input
                  type="time"
                  value={newStart}
                  onChange={e => setNewStart(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm text-[#F5F0E8] outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", colorScheme: "dark" }}
                />
              </div>
              <div>
                <p className="text-[11px] opacity-40 mb-1">End</p>
                <input
                  type="time"
                  value={newEnd}
                  onChange={e => setNewEnd(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm text-[#F5F0E8] outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", colorScheme: "dark" }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: newCategory === cat ? CAT_COLORS[cat] + "33" : "rgba(255,255,255,0.06)",
                    border:     `1px solid ${newCategory === cat ? CAT_COLORS[cat] + "99" : "rgba(255,255,255,0.1)"}`,
                    color:      newCategory === cat ? CAT_COLORS[cat] : "rgba(245,240,232,0.45)",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={addEvent}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-[#F5F0E8] transition-opacity hover:opacity-90"
                style={{ background: CAT_COLORS[newCategory] }}
              >
                Add Block
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(245,240,232,0.5)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
