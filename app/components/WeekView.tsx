"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"

interface Goal          { id: number; text: string; done: boolean }
interface Task          { id: number; title: string; done: boolean }
interface Chore         { id: number; title: string; done: boolean }
interface Habit         { id: number; name: string }
interface HabitDay      { id: number; habitId: number; weekId: number; day: DayKey; done: boolean }
interface Deliverable   { id: number; name: string; progress: number }
interface UpskillingItem{ id: number; name: string; provider: string; progress: number }
interface Note          { id: number; text: string; tag: string | null; createdAt: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const RING_COLORS = ["#F59E0B", "#EC4899", "#06B6D4", "#8B5CF6", "#10B981", "#F97316"]

const NOTE_TAGS = [
  "Explore Further",
  "Brain Wave",
  "Interested - On My Mind",
  "Money Matters",
  "Random Musings",
]

const TAG_COLORS: Record<string, string> = {
  "Explore Further":        "#06B6D4",
  "Brain Wave":             "#8B5CF6",
  "Interested - On My Mind":"#F59E0B",
  "Money Matters":          "#10B981",
  "Random Musings":         "#EC4899",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressRing({ progress, color, size = 60 }: { progress: number; color: string; size?: number }) {
  const stroke = 4
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, progress)) / 100) * circ
  const c = size / 2
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color }}>
        {progress}%
      </span>
    </div>
  )
}

function GoldCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-all duration-150"
      style={{
        borderColor: checked ? "#D4A853" : "rgba(255,255,255,0.22)",
        background:  checked ? "#D4A853" : "transparent",
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3 5.5L8 1" stroke="#0C0A0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function Confetti() {
  const COLORS = ["#D4A853", "#8A2436", "#EC4899", "#06B6D4", "#8B5CF6", "#10B981"]
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden>
      {Array.from({ length: 32 }, (_, i) => (
        <div
          key={i}
          className="absolute bottom-0 confetti-particle"
          style={{
            left:            `${5 + (i / 32) * 90 + (i % 5)}%`,
            width:           6 + (i % 3) * 2,
            height:          6 + (i % 4),
            backgroundColor: COLORS[i % COLORS.length],
            borderRadius:    i % 4 === 0 ? "50%" : "2px",
            animationDelay:  `${(i % 10) * 45}ms`,
          }}
        />
      ))}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function XIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CARD = "rounded-2xl p-5 border"
const CARD_STYLE = { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }

export default function WeekView() {
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()))

  const [weekId,      setWeekId]      = useState<number | null>(null)
  const [weeklyFocus, setWeeklyFocus] = useState("")
  const [goals,       setGoals]       = useState<Goal[]>([])
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [chores,      setChores]      = useState<Chore[]>([])

  const [habits,    setHabits]    = useState<Habit[]>([])
  const [habitDays, setHabitDays] = useState<HabitDay[]>([])

  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [upskilling,   setUpskilling]   = useState<UpskillingItem[]>([])
  const [notes,        setNotes]        = useState<Note[]>([])

  const [noteFilter,       setNoteFilter]       = useState("All")
  const [openTagNote,      setOpenTagNote]       = useState<number | null>(null)
  const [newGoalText,      setNewGoalText]       = useState("")
  const [newTaskText,      setNewTaskText]       = useState("")
  const [newChoreText,     setNewChoreText]      = useState("")
  const [newHabitName,     setNewHabitName]      = useState("")
  const [newDelivName,     setNewDelivName]      = useState("")
  const [newUpskillName,   setNewUpskillName]    = useState("")
  const [newUpskillProv,   setNewUpskillProv]    = useState("")
  const [newNoteText,      setNewNoteText]       = useState("")
  const [celebrationKey,   setCelebrationKey]    = useState(0)
  const [loading,          setLoading]           = useState(true)

  const focusRef      = useRef<HTMLTextAreaElement>(null)
  const focusTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  // ─── Celebration ──────────────────────────────────────────────────────────

  const celebrate = useCallback(() => setCelebrationKey(k => k + 1), [])

  // ─── Load week ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    const monday = toDateStr(currentMonday)
    fetch(`/api/weeks?monday=${monday}`)
      .then(r => r.json())
      .then(week => {
        setWeekId(week.id)
        setWeeklyFocus(week.weeklyFocus ?? "")
        setGoals(week.goals  ?? [])
        setTasks(week.tasks  ?? [])
        setChores(week.chores ?? [])
        return week.id as number
      })
      .then(wid =>
        fetch(`/api/habit-days?weekId=${wid}`)
          .then(r => r.json())
          .then(setHabitDays)
      )
      .finally(() => setLoading(false))
  }, [currentMonday])

  // ─── Load globals (once) ─────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/habits").then(r => r.json()).then(setHabits)
    fetch("/api/deliverables").then(r => r.json()).then(setDeliverables)
    fetch("/api/upskilling").then(r => r.json()).then(setUpskilling)
    fetch("/api/notes").then(r => r.json()).then(setNotes)
  }, [])

  // ─── Auto-grow textarea ───────────────────────────────────────────────────

  useEffect(() => {
    const el = focusRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }, [weeklyFocus])

  // ─── Navigation ──────────────────────────────────────────────────────────

  const prevWeek = () => setCurrentMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setCurrentMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  const goToday  = () => setCurrentMonday(getMonday(new Date()))

  // ─── Weekly focus ─────────────────────────────────────────────────────────

  const handleFocusChange = (val: string) => {
    setWeeklyFocus(val)
    if (focusTimer.current) clearTimeout(focusTimer.current)
    focusTimer.current = setTimeout(() => {
      if (weekId) fetch(`/api/weeks/${weekId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weeklyFocus: val }) })
    }, 600)
  }

  // ─── Goals ────────────────────────────────────────────────────────────────

  const addGoal = async () => {
    if (!newGoalText.trim() || !weekId) return
    const goal: Goal = await fetch(`/api/weeks/${weekId}/goals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: newGoalText.trim() }) }).then(r => r.json())
    setGoals(g => [...g, goal])
    setNewGoalText("")
  }

  const toggleGoal = async (goal: Goal) => {
    setGoals(gs => gs.map(g => g.id === goal.id ? { ...g, done: !g.done } : g))
    await fetch(`/api/weeks/${weekId}/goals/${goal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !goal.done }) })
    if (!goal.done) celebrate()
  }

  const deleteGoal = async (id: number) => {
    setGoals(gs => gs.filter(g => g.id !== id))
    await fetch(`/api/weeks/${weekId}/goals/${id}`, { method: "DELETE" })
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────

  const addTask = async () => {
    if (!newTaskText.trim() || !weekId) return
    const task: Task = await fetch(`/api/weeks/${weekId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTaskText.trim() }) }).then(r => r.json())
    setTasks(t => [...t, task])
    setNewTaskText("")
  }

  const toggleTask = async (task: Task) => {
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
    await fetch(`/api/weeks/${weekId}/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !task.done }) })
    if (!task.done) celebrate()
  }

  const deleteTask = async (id: number) => {
    setTasks(ts => ts.filter(t => t.id !== id))
    await fetch(`/api/weeks/${weekId}/tasks/${id}`, { method: "DELETE" })
  }

  // ─── Chores ───────────────────────────────────────────────────────────────

  const addChore = async () => {
    if (!newChoreText.trim() || !weekId) return
    const chore: Chore = await fetch(`/api/weeks/${weekId}/chores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newChoreText.trim() }) }).then(r => r.json())
    setChores(c => [...c, chore])
    setNewChoreText("")
  }

  const toggleChore = async (chore: Chore) => {
    setChores(cs => cs.map(c => c.id === chore.id ? { ...c, done: !c.done } : c))
    await fetch(`/api/weeks/${weekId}/chores/${chore.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !chore.done }) })
    if (!chore.done) celebrate()
  }

  const deleteChore = async (id: number) => {
    setChores(cs => cs.filter(c => c.id !== id))
    await fetch(`/api/weeks/${weekId}/chores/${id}`, { method: "DELETE" })
  }

  // ─── Habits ───────────────────────────────────────────────────────────────

  const addHabit = async () => {
    if (!newHabitName.trim()) return
    const habit: Habit = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newHabitName.trim() }) }).then(r => r.json())
    setHabits(hs => [...hs, habit])
    setNewHabitName("")
  }

  const deleteHabit = async (id: number) => {
    setHabits(hs => hs.filter(h => h.id !== id))
    setHabitDays(hds => hds.filter(hd => hd.habitId !== id))
    await fetch(`/api/habits/${id}`, { method: "DELETE" })
  }

  const toggleHabitDay = async (habitId: number, day: DayKey) => {
    const existing = habitDays.find(hd => hd.habitId === habitId && hd.day === day)
    const newDone  = !(existing?.done ?? false)
    if (existing) {
      setHabitDays(hds => hds.map(hd => hd.id === existing.id ? { ...hd, done: newDone } : hd))
    } else {
      setHabitDays(hds => [...hds, { id: -Date.now(), habitId, weekId: weekId!, day, done: newDone }])
    }
    const saved: HabitDay = await fetch("/api/habit-days", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habitId, weekId, day, done: newDone }) }).then(r => r.json())
    setHabitDays(hds => hds.map(hd => (hd.habitId === habitId && hd.day === day) ? saved : hd))
    if (newDone) celebrate()
  }

  const isHabitDone = (habitId: number, day: DayKey) =>
    habitDays.find(hd => hd.habitId === habitId && hd.day === day)?.done ?? false

  const habitCount = (habitId: number) => DAYS.filter(d => isHabitDone(habitId, d)).length

  // ─── Deliverables ─────────────────────────────────────────────────────────

  const addDeliverable = async () => {
    if (!newDelivName.trim()) return
    const item: Deliverable = await fetch("/api/deliverables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newDelivName.trim() }) }).then(r => r.json())
    setDeliverables(ds => [...ds, item])
    setNewDelivName("")
  }

  const updateDelivProgress = (id: number, progress: number) => {
    setDeliverables(ds => ds.map(d => d.id === id ? { ...d, progress } : d))
    if (progressTimers.current[id]) clearTimeout(progressTimers.current[id])
    progressTimers.current[id] = setTimeout(() => {
      fetch(`/api/deliverables/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress }) })
    }, 400)
  }

  const deleteDeliverable = async (id: number) => {
    setDeliverables(ds => ds.filter(d => d.id !== id))
    await fetch(`/api/deliverables/${id}`, { method: "DELETE" })
  }

  // ─── Upskilling ───────────────────────────────────────────────────────────

  const addUpskilling = async () => {
    if (!newUpskillName.trim() || !newUpskillProv.trim()) return
    const item: UpskillingItem = await fetch("/api/upskilling", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newUpskillName.trim(), provider: newUpskillProv.trim() }) }).then(r => r.json())
    setUpskilling(us => [...us, item])
    setNewUpskillName("")
    setNewUpskillProv("")
  }

  const updateUpskillProgress = (id: number, progress: number) => {
    setUpskilling(us => us.map(u => u.id === id ? { ...u, progress } : u))
    if (progressTimers.current[id]) clearTimeout(progressTimers.current[id])
    progressTimers.current[id] = setTimeout(() => {
      fetch(`/api/upskilling/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress }) })
    }, 400)
  }

  const deleteUpskilling = async (id: number) => {
    setUpskilling(us => us.filter(u => u.id !== id))
    await fetch(`/api/upskilling/${id}`, { method: "DELETE" })
  }

  // ─── Notes ────────────────────────────────────────────────────────────────

  const addNote = async () => {
    if (!newNoteText.trim()) return
    const note: Note = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: newNoteText.trim() }) }).then(r => r.json())
    setNotes(ns => [note, ...ns])
    setNewNoteText("")
  }

  const addNoteTag = async (id: number, tag: string) => {
    setNotes(ns => ns.map(n => n.id === id ? { ...n, tag } : n))
    setOpenTagNote(null)
    await fetch(`/api/notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tag }) })
  }

  const deleteNote = async (id: number) => {
    setNotes(ns => ns.filter(n => n.id !== id))
    await fetch(`/api/notes/${id}`, { method: "DELETE" })
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const todayMonday    = getMonday(new Date())
  const isCurrentWeek  = toDateStr(todayMonday) === toDateStr(currentMonday)
  const todayDayIndex  = isCurrentWeek ? (new Date().getDay() + 6) % 7 : -1

  const filteredNotes = notes.filter(n => {
    if (noteFilter === "All")     return true
    if (noteFilter === "Untagged") return !n.tag
    return n.tag === noteFilter
  })

  // ─── Add input helpers ────────────────────────────────────────────────────

  const addRow = (value: string, setValue: (v: string) => void, onAdd: () => void, placeholder: string) => (
    <div className="flex items-center gap-2 pt-1">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onAdd()}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm placeholder-white/20 outline-none border-b border-white/10 pb-1 text-[#F5F0E8]"
      />
      <button onClick={onAdd} className="text-[#D4A853] hover:text-[#E8C070] transition-colors flex-shrink-0">
        <PlusIcon />
      </button>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-[#F5F0E8]" style={{ background: "#0C0A0B" }}>

      {celebrationKey > 0 && <Confetti key={celebrationKey} />}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-wide">{formatWeekRange(currentMonday)}</h1>
            {!isCurrentWeek && (
              <button onClick={goToday} className="text-xs px-3 py-1 rounded-full border transition-colors" style={{ borderColor: "rgba(212,168,83,0.4)", color: "#D4A853" }}>
                Today
              </button>
            )}
          </div>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 opacity-30 text-sm">Loading…</div>
        ) : (
          <>
            {/* ── Weekly Focus ── */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "radial-gradient(at 88% 12%, rgba(176,130,60,0.38), transparent 50%), linear-gradient(135deg,#8A2436,#581621)" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-3">Weekly Focus</p>
              <textarea
                ref={focusRef}
                value={weeklyFocus}
                onChange={e => handleFocusChange(e.target.value)}
                placeholder="What is this week really about?"
                rows={1}
                className="w-full bg-transparent text-[#F5F0E8] text-2xl font-bold placeholder-white/25 resize-none outline-none leading-tight overflow-hidden"
                style={{ minHeight: "2.5rem" }}
              />

              <div className="mt-5 space-y-2">
                {goals.map(g => (
                  <div key={g.id} className="flex items-center gap-3 group">
                    <GoldCheckbox checked={g.done} onChange={() => toggleGoal(g)} />
                    <span className={`flex-1 text-sm leading-relaxed ${g.done ? "line-through opacity-40" : ""}`}>{g.text}</span>
                    <button onClick={() => deleteGoal(g.id)} className="opacity-0 group-hover:opacity-30 hover:!opacity-80 transition-opacity text-white">
                      <XIcon />
                    </button>
                  </div>
                ))}
                {addRow(newGoalText, setNewGoalText, addGoal, "Add a goal…")}
              </div>
            </div>

            {/* ── Tasks + Chores ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className={CARD} style={CARD_STYLE}>
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-4">Tasks</p>
                <div className="space-y-2">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 group">
                      <GoldCheckbox checked={t.done} onChange={() => toggleTask(t)} />
                      <span className={`flex-1 text-sm ${t.done ? "line-through opacity-40" : ""}`}>{t.title}</span>
                      <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-30 hover:!opacity-80 transition-opacity">
                        <XIcon />
                      </button>
                    </div>
                  ))}
                  {addRow(newTaskText, setNewTaskText, addTask, "Add task…")}
                </div>
              </div>

              <div className={CARD} style={CARD_STYLE}>
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-4">Chores</p>
                <div className="space-y-2">
                  {chores.map(c => (
                    <div key={c.id} className="flex items-center gap-3 group">
                      <GoldCheckbox checked={c.done} onChange={() => toggleChore(c)} />
                      <span className={`flex-1 text-sm ${c.done ? "line-through opacity-40" : ""}`}>{c.title}</span>
                      <button onClick={() => deleteChore(c.id)} className="opacity-0 group-hover:opacity-30 hover:!opacity-80 transition-opacity">
                        <XIcon />
                      </button>
                    </div>
                  ))}
                  {addRow(newChoreText, setNewChoreText, addChore, "Add chore…")}
                </div>
              </div>
            </div>

            {/* ── Routines & Gym ── */}
            <div className={CARD} style={CARD_STYLE}>
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-4">Routines &amp; Gym</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pb-3 pr-4 text-xs font-normal opacity-30 w-32" />
                      {DAYS.map((day, i) => (
                        <th
                          key={day}
                          className="pb-3 text-xs font-semibold text-center w-10"
                          style={{ color: i === todayDayIndex ? "#D4A853" : "rgba(245,240,232,0.35)" }}
                        >
                          {day}
                        </th>
                      ))}
                      <th className="pb-3 text-xs font-normal opacity-30 pl-3 text-right">/7</th>
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map(habit => (
                      <tr key={habit.id} className="group">
                        <td className="py-1.5 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{habit.name}</span>
                            <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-25 hover:!opacity-70 transition-opacity">
                              <XIcon size={11} />
                            </button>
                          </div>
                        </td>
                        {DAYS.map((day, i) => {
                          const done    = isHabitDone(habit.id, day)
                          const isToday = i === todayDayIndex
                          return (
                            <td key={day} className="py-1.5 text-center">
                              <button
                                onClick={() => toggleHabitDay(habit.id, day)}
                                className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all duration-150"
                                style={{
                                  background:  done    ? "#D4A853"
                                             : isToday ? "rgba(212,168,83,0.1)"
                                             :           "rgba(255,255,255,0.04)",
                                  border: isToday && !done ? "1px solid rgba(212,168,83,0.25)" : "1px solid transparent",
                                }}
                              >
                                {done && (
                                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                    <path d="M1 4.5L3.5 7L10 1" stroke="#0C0A0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          )
                        })}
                        <td className="py-1.5 pl-3 text-sm font-bold text-right" style={{ color: "#D4A853" }}>
                          {habitCount(habit.id)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.05]">
                {addRow(newHabitName, setNewHabitName, addHabit, "Add habit…")}
              </div>
            </div>

            {/* ── Work Deliverables ── */}
            <div className={CARD} style={CARD_STYLE}>
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-4">Work Deliverables</p>
              <div className="space-y-4">
                {deliverables.map((d, i) => {
                  const color = RING_COLORS[i % RING_COLORS.length]
                  return (
                    <div key={d.id} className="flex items-center gap-4 group">
                      <ProgressRing progress={d.progress} color={color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium truncate">{d.name}</span>
                          <button onClick={() => deleteDeliverable(d.id)} className="opacity-0 group-hover:opacity-25 hover:!opacity-70 transition-opacity ml-2 flex-shrink-0">
                            <XIcon />
                          </button>
                        </div>
                        <input
                          type="range" min={0} max={100} value={d.progress}
                          onChange={e => updateDelivProgress(d.id, parseInt(e.target.value))}
                          className="w-full h-1 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
                {addRow(newDelivName, setNewDelivName, addDeliverable, "Add deliverable…")}
              </div>
            </div>

            {/* ── Upskilling ── */}
            <div className={CARD} style={CARD_STYLE}>
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-4">Upskilling</p>
              <div className="space-y-4">
                {upskilling.map((u, i) => {
                  const color = RING_COLORS[(i + 3) % RING_COLORS.length]
                  return (
                    <div key={u.id} className="flex items-center gap-4 group">
                      <ProgressRing progress={u.progress} color={color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium truncate">{u.name}</span>
                          <button onClick={() => deleteUpskilling(u.id)} className="opacity-0 group-hover:opacity-25 hover:!opacity-70 transition-opacity ml-2 flex-shrink-0">
                            <XIcon />
                          </button>
                        </div>
                        <p className="text-xs opacity-35 mb-2">{u.provider}</p>
                        <input
                          type="range" min={0} max={100} value={u.progress}
                          onChange={e => updateUpskillProgress(u.id, parseInt(e.target.value))}
                          className="w-full h-1 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-end gap-2 pt-1">
                  <div className="flex-1 space-y-2">
                    <input
                      value={newUpskillName}
                      onChange={e => setNewUpskillName(e.target.value)}
                      placeholder="Skill name…"
                      className="w-full bg-transparent text-sm placeholder-white/20 outline-none border-b border-white/10 pb-1 text-[#F5F0E8]"
                    />
                    <input
                      value={newUpskillProv}
                      onChange={e => setNewUpskillProv(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addUpskilling()}
                      placeholder="Provider (e.g. Coursera)…"
                      className="w-full bg-transparent text-sm placeholder-white/20 outline-none border-b border-white/10 pb-1 text-[#F5F0E8]"
                    />
                  </div>
                  <button onClick={addUpskilling} className="text-[#D4A853] hover:text-[#E8C070] transition-colors pb-1 flex-shrink-0">
                    <PlusIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Notes to Self ── */}
            <div className={CARD} style={CARD_STYLE}>
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-4">Notes to Self</p>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {["All", "Untagged", ...NOTE_TAGS].map(f => (
                  <button
                    key={f}
                    onClick={() => setNoteFilter(f)}
                    className="text-xs px-3 py-1 rounded-full transition-all"
                    style={{
                      background:  noteFilter === f ? (TAG_COLORS[f] ?? "#D4A853") + "20" : "rgba(255,255,255,0.04)",
                      border:     `1px solid ${noteFilter === f ? (TAG_COLORS[f] ?? "#D4A853") + "55" : "rgba(255,255,255,0.08)"}`,
                      color:       noteFilter === f ? (TAG_COLORS[f] ?? "#D4A853") : "rgba(245,240,232,0.5)",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Capture */}
              <div className="flex items-center gap-2 mb-5">
                <input
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Capture a thought…"
                  className="flex-1 bg-transparent text-sm placeholder-white/20 outline-none border-b border-white/10 pb-1 text-[#F5F0E8]"
                />
                <button onClick={addNote} className="text-[#D4A853] hover:text-[#E8C070] transition-colors">
                  <PlusIcon />
                </button>
              </div>

              {/* Note cards */}
              <div className="space-y-3">
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    className="rounded-xl p-4 relative group"
                    style={{
                      background:  "rgba(255,255,255,0.04)",
                      borderLeft: `3px solid ${note.tag ? (TAG_COLORS[note.tag] ?? "#D4A853") : "rgba(255,255,255,0.12)"}`,
                    }}
                  >
                    <p className="text-sm leading-relaxed pr-7">{note.text}</p>

                    <button
                      onClick={() => deleteNote(note.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-25 hover:!opacity-70 transition-opacity"
                    >
                      <XIcon />
                    </button>

                    <div className="mt-2">
                      {note.tag ? (
                        <span
                          className="inline-block text-xs px-2 py-0.5 rounded-full"
                          style={{ background: (TAG_COLORS[note.tag] ?? "#D4A853") + "20", color: TAG_COLORS[note.tag] ?? "#D4A853" }}
                        >
                          {note.tag}
                        </span>
                      ) : openTagNote === note.id ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {NOTE_TAGS.map(t => (
                            <button
                              key={t}
                              onClick={() => addNoteTag(note.id, t)}
                              className="text-xs px-2 py-0.5 rounded-full transition-all hover:opacity-100"
                              style={{ background: TAG_COLORS[t] + "20", color: TAG_COLORS[t], border: `1px solid ${TAG_COLORS[t]}40` }}
                            >
                              {t}
                            </button>
                          ))}
                          <button onClick={() => setOpenTagNote(null)} className="text-xs opacity-30 hover:opacity-60 ml-1">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setOpenTagNote(note.id)}
                          className="text-xs opacity-25 hover:opacity-60 transition-opacity"
                          style={{ color: "#D4A853" }}
                        >
                          + Add tag
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  )
}
