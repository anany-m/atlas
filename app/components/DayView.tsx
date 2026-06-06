"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Work" | "Personal" | "Health" | "Social" | "Focus"

interface EventItem {
  id: number
  date: string
  startTime: string
  endTime: string
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

const GRID_START = 7
const GRID_END   = 22
const HOUR_H     = 46

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function dayLabel(d: Date): string {
  const isToday = toDateStr(d) === toDateStr(new Date())
  if (isToday) return "Today"
  return d.toLocaleDateString("en-US", { weekday: "long" })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function mins(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

function timeToY(t: string): number {
  return (mins(t) - GRID_START * 60) * (HOUR_H / 60)
}

function durationPx(start: string, end: string): number {
  return Math.max(22, (mins(end) - mins(start)) * (HOUR_H / 60))
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12am"
  if (h === 12)            return "12pm"
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

function pad2(n: number): string { return String(n).padStart(2, "0") }

function computeLayout(events: EventItem[]): Map<number, { leftPct: number; widthPct: number }> {
  const result = new Map<number, { leftPct: number; widthPct: number }>()
  if (!events.length) return result
  const sorted  = [...events].sort((a, b) => mins(a.startTime) - mins(b.startTime))
  const colEnds: number[] = []
  for (const e of sorted) {
    const start = mins(e.startTime)
    const end   = mins(e.endTime)
    let col = colEnds.findIndex(endMin => endMin <= start)
    if (col === -1) col = colEnds.length
    colEnds[col] = end
    result.set(e.id, { leftPct: col, widthPct: -1 })
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
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
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

  useEffect(() => {
    setLoading(true)
    fetch(`/api/events?date=${toDateStr(currentDate)}`)
      .then(r => r.json()).then(setEvents).finally(() => setLoading(false))
  }, [currentDate])

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

  const prevDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const nextDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCurrentDate(d) }

  const addEvent = async () => {
    if (!newTitle.trim()) return
    const event: EventItem = await fetch("/api/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: toDateStr(currentDate), startTime: newStart, endTime: newEnd, title: newTitle.trim(), category: newCategory }),
    }).then(r => r.json())
    setEvents(es => [...es, event])
    closeForm()
  }

  const closeForm = () => {
    setShowForm(false); setNewTitle(""); setNewStart("09:00"); setNewEnd("10:00"); setNewCategory("Work")
  }

  const deleteEvent = async (id: number) => {
    setEvents(es => es.filter(e => e.id !== id))
    await fetch(`/api/events/${id}`, { method: "DELETE" })
  }

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

  const layout      = computeLayout(events)
  const HOUR_LABELS = Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => GRID_START + i)

  return (
    <div style={{ color: "var(--ink)" }} className="space-y-5 py-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div>
          <div className="text-xs uppercase mb-1" style={{ color: "var(--ink-soft)", letterSpacing: "0.18em" }}>
            {dayLabel(currentDate)}
          </div>
          <h1 className="font-display text-3xl md:text-4xl">{formatDate(currentDate)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="p-2 rounded-lg" style={{ border: "1px solid var(--line)", backgroundColor: "var(--card)", color: "var(--ink-soft)" }}>
            <ChevronLeft size={18} />
          </button>
          {!isToday && (
            <button onClick={goToday} className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ border: "1px solid var(--line)", color: "var(--burgundy)", backgroundColor: "var(--card)" }}>
              Today
            </button>
          )}
          <button onClick={nextDay} className="p-2 rounded-lg" style={{ border: "1px solid var(--line)", backgroundColor: "var(--card)", color: "var(--ink-soft)" }}>
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--burgundy)" }}>
            <Plus size={14} /> Add block
          </button>
        </div>
      </div>

      {/* ── Color legend ── */}
      <div className="flex items-center gap-5 flex-wrap">
        {CATEGORIES.map(cat => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CAT_COLORS[cat] }} />
            <span className="text-xs" style={{ color: "var(--ink-soft)" }}>{cat}</span>
          </div>
        ))}
      </div>

      {/* ── Time grid ── */}
      <div className="rounded-2xl overflow-hidden border" style={{ background: "var(--card)", borderColor: "var(--line)", boxShadow: "0 1px 3px rgba(40,20,24,0.05)" }}>
        <div className="overflow-y-auto" style={{ maxHeight: "72vh" }}>
          <div className="flex">
            {/* Time labels */}
            <div className="shrink-0 w-14 select-none">
              {HOUR_LABELS.map(h => (
                <div key={h} className="flex items-start justify-end pr-3"
                  style={{ height: h < GRID_END ? HOUR_H : 20, paddingTop: 2 }}>
                  <span className="text-[11px]" style={{ color: "var(--ink-soft)", opacity: 0.6 }}>{formatHour(h)}</span>
                </div>
              ))}
            </div>

            {/* Events column */}
            <div className="flex-1 relative cursor-crosshair"
              style={{ height: (GRID_END - GRID_START) * HOUR_H }}
              onClick={handleGridClick}>
              {/* Hour grid lines */}
              {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                <div key={i} className="absolute w-full border-t" style={{ top: i * HOUR_H, borderColor: "var(--line)" }} />
              ))}
              {/* Half-hour lines */}
              {Array.from({ length: GRID_END - GRID_START }, (_, i) => (
                <div key={`h${i}`} className="absolute w-full" style={{ top: i * HOUR_H + HOUR_H / 2, height: 1, background: "rgba(0,0,0,0.04)" }} />
              ))}

              {/* Current time indicator */}
              {isToday && timeY !== null && (
                <div className="absolute w-full flex items-center pointer-events-none z-20" style={{ top: timeY - 1 }}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 -ml-1.5" style={{ background: "#DC2626" }} />
                  <div className="flex-1 h-px" style={{ background: "rgba(220,38,38,0.6)" }} />
                </div>
              )}

              {/* Event blocks */}
              {!loading && events.map(event => {
                const pos    = layout.get(event.id) ?? { leftPct: 0, widthPct: 99.6 }
                const top    = timeToY(event.startTime)
                const height = durationPx(event.startTime, event.endTime)
                const color  = CAT_COLORS[event.category]
                return (
                  <div key={event.id} className="absolute rounded-md overflow-hidden group select-none"
                    style={{ top, height, left: `${pos.leftPct}%`, width: `${pos.widthPct}%`, background: color + "CC", borderLeft: `3px solid ${color}`, padding: "3px 6px" }}
                    onClick={e => e.stopPropagation()}>
                    <p className="text-[12px] font-semibold leading-tight text-white truncate">{event.title}</p>
                    {height > 36 && (
                      <p className="text-[10px] text-white opacity-60 mt-0.5">{event.startTime} – {event.endTime}</p>
                    )}
                    <button onClick={() => deleteEvent(event.id)}
                      className="absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity text-white"
                      style={{ background: "rgba(0,0,0,0.35)", fontSize: 11 }}>×</button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Event Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }} onClick={closeForm}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }} onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>Add Block</h2>
            <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addEvent()} placeholder="Block title…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>Start</p>
                <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
              </div>
              <div>
                <p className="text-[11px] mb-1" style={{ color: "var(--ink-soft)" }}>End</p>
                <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setNewCategory(cat)} className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: newCategory === cat ? CAT_COLORS[cat] + "28" : "var(--paper)",
                    border:    `1px solid ${newCategory === cat ? CAT_COLORS[cat] + "99" : "var(--line)"}`,
                    color:      newCategory === cat ? CAT_COLORS[cat] : "var(--ink-soft)",
                  }}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addEvent} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: CAT_COLORS[newCategory] }}>
                Add Block
              </button>
              <button onClick={closeForm} className="px-4 py-2 rounded-lg text-sm"
                style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
