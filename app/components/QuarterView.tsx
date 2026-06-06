"use client"

import { useState, useEffect, useRef } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavingsEntry   { id: number; label: string; amount: number; type: "saved" | "expense" }
interface InvEntry       { id: number; name: string; amount: number; investmentId: number }
interface Investment     { id: number; goalAmount: number; entries: InvEntry[] }
interface QuarterGoal    { id: number; name: string; progress: number }
interface HealthMetric   { id: number; name: string; currentValue: number; goalValue: number }
interface ParkingItem    { id: number; text: string; category: string; link: string | null }

// ─── Constants ────────────────────────────────────────────────────────────────

const INV_COLORS = ["#F59E0B","#EC4899","#06B6D4","#8B5CF6","#10B981","#F97316","#FB7185","#A78BFA","#34D399","#60A5FA"]

const PARKING_COLS = ["Add to Cart","Health & Wellbeing","Leisure","Interested","Money Matters","Random"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentQY(): { q: number; y: number } {
  const now = new Date()
  return { q: Math.ceil((now.getMonth() + 1) / 3), y: now.getFullYear() }
}

function prevQY(q: number, y: number) { return q === 1 ? { q: 4, y: y - 1 } : { q: q - 1, y } }
function nextQY(q: number, y: number) { return q === 4 ? { q: 1, y: y + 1 } : { q: q + 1, y } }

function fmt$(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)
}

// ─── Shared card style ────────────────────────────────────────────────────────

const CARD = "rounded-2xl p-5 border"
const CS   = { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest opacity-50 mb-4">{children}</p>
}

function XBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity flex-shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuarterView() {
  const init = currentQY()
  const [q, setQ] = useState(init.q)
  const [y, setY] = useState(init.y)

  const [savings,    setSavings]    = useState<SavingsEntry[]>([])
  const [investment, setInvestment] = useState<Investment | null>(null)
  const [goals,      setGoals]      = useState<QuarterGoal[]>([])
  const [health,     setHealth]     = useState<HealthMetric[]>([])
  const [parking,    setParking]    = useState<ParkingItem[]>([])

  // Savings form
  const [sLabel,  setSLabel]  = useState("")
  const [sAmount, setSAmount] = useState("")
  const [sType,   setSType]   = useState<"saved"|"expense">("saved")

  // Investment form
  const [iName,   setIName]   = useState("")
  const [iAmount, setIAmount] = useState("")

  // Goals form
  const [gName, setGName] = useState("")

  // Health form
  const [hName,    setHName]    = useState("")
  const [hCurrent, setHCurrent] = useState("")
  const [hGoal,    setHGoal]    = useState("")

  // Parking form
  const [addingCol, setAddingCol]  = useState<string | null>(null)
  const [pText,     setPText]      = useState("")
  const [pLink,     setPLink]      = useState("")

  const goalTimers   = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const healthTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const invGoalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const qs = `q=${q}&y=${y}`

  // ─── Load all data ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/quarter/savings?${qs}`).then(r => r.json()).then(setSavings)
    fetch(`/api/quarter/investment?${qs}`).then(r => r.json()).then(setInvestment)
    fetch(`/api/quarter/goals?${qs}`).then(r => r.json()).then(setGoals)
    fetch(`/api/quarter/health?${qs}`).then(r => r.json()).then(setHealth)
    fetch(`/api/quarter/parking-lot?${qs}`).then(r => r.json()).then(setParking)
  }, [q, y]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Navigation ────────────────────────────────────────────────────────────

  const goBack    = () => { const p = prevQY(q, y); setQ(p.q); setY(p.y) }
  const goForward = () => { const n = nextQY(q, y); setQ(n.q); setY(n.y) }
  const goCurrent = () => { const c = currentQY(); setQ(c.q); setY(c.y) }
  const isCurrent = q === init.q && y === init.y

  // ─── Savings ───────────────────────────────────────────────────────────────

  const addSavings = async () => {
    if (!sLabel.trim() || !sAmount) return
    const entry: SavingsEntry = await fetch("/api/quarter/savings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: sLabel.trim(), amount: parseFloat(sAmount), type: sType, quarter: q, year: y }),
    }).then(r => r.json())
    setSavings(s => [...s, entry])
    setSLabel(""); setSAmount("")
  }

  const deleteSavings = async (id: number) => {
    setSavings(s => s.filter(e => e.id !== id))
    await fetch(`/api/quarter/savings/${id}`, { method: "DELETE" })
  }

  // ─── Investment ────────────────────────────────────────────────────────────

  const updateGoalAmount = (val: number) => {
    if (!investment) return
    setInvestment(iv => iv ? { ...iv, goalAmount: val } : iv)
    if (invGoalTimer.current) clearTimeout(invGoalTimer.current)
    invGoalTimer.current = setTimeout(() =>
      fetch(`/api/quarter/investment?${qs}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goalAmount: val }) }),
    500)
  }

  const addInvEntry = async () => {
    if (!iName.trim() || !iAmount || !investment) return
    const entry: InvEntry = await fetch("/api/quarter/investment/entries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investmentId: investment.id, name: iName.trim(), amount: parseFloat(iAmount) }),
    }).then(r => r.json())
    setInvestment(iv => iv ? { ...iv, entries: [...iv.entries, entry] } : iv)
    setIName(""); setIAmount("")
  }

  const deleteInvEntry = async (id: number) => {
    setInvestment(iv => iv ? { ...iv, entries: iv.entries.filter(e => e.id !== id) } : iv)
    await fetch(`/api/quarter/investment/entries/${id}`, { method: "DELETE" })
  }

  // ─── Goals ─────────────────────────────────────────────────────────────────

  const addGoal = async () => {
    if (!gName.trim()) return
    const goal: QuarterGoal = await fetch("/api/quarter/goals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: gName.trim(), quarter: q, year: y }),
    }).then(r => r.json())
    setGoals(gs => [...gs, goal])
    setGName("")
  }

  const updateGoalProgress = (id: number, progress: number) => {
    setGoals(gs => gs.map(g => g.id === id ? { ...g, progress } : g))
    if (goalTimers.current[id]) clearTimeout(goalTimers.current[id])
    goalTimers.current[id] = setTimeout(() =>
      fetch(`/api/quarter/goals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress }) }),
    400)
  }

  const deleteGoal = async (id: number) => {
    setGoals(gs => gs.filter(g => g.id !== id))
    await fetch(`/api/quarter/goals/${id}`, { method: "DELETE" })
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  const addHealth = async () => {
    if (!hName.trim() || !hGoal) return
    const m: HealthMetric = await fetch("/api/quarter/health", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: hName.trim(), currentValue: parseFloat(hCurrent) || 0, goalValue: parseFloat(hGoal), quarter: q, year: y }),
    }).then(r => r.json())
    setHealth(hs => [...hs, m])
    setHName(""); setHCurrent(""); setHGoal("")
  }

  const updateHealthCurrent = (id: number, currentValue: number) => {
    setHealth(hs => hs.map(h => h.id === id ? { ...h, currentValue } : h))
    if (healthTimers.current[id]) clearTimeout(healthTimers.current[id])
    healthTimers.current[id] = setTimeout(() =>
      fetch(`/api/quarter/health/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentValue }) }),
    400)
  }

  const deleteHealth = async (id: number) => {
    setHealth(hs => hs.filter(h => h.id !== id))
    await fetch(`/api/quarter/health/${id}`, { method: "DELETE" })
  }

  // ─── Parking Lot ───────────────────────────────────────────────────────────

  const addParking = async (category: string) => {
    if (!pText.trim()) return
    const item: ParkingItem = await fetch("/api/quarter/parking-lot", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pText.trim(), category, link: pLink.trim() || null, quarter: q, year: y }),
    }).then(r => r.json())
    setParking(ps => [...ps, item])
    setPText(""); setPLink(""); setAddingCol(null)
  }

  const moveParkingItem = async (id: number, category: string) => {
    setParking(ps => ps.map(p => p.id === id ? { ...p, category } : p))
    await fetch(`/api/quarter/parking-lot/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category }) })
  }

  const deleteParking = async (id: number) => {
    setParking(ps => ps.filter(p => p.id !== id))
    await fetch(`/api/quarter/parking-lot/${id}`, { method: "DELETE" })
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const grossSaved = savings.filter(s => s.type === "saved").reduce((a, s) => a + s.amount, 0)
  const totalSpent = savings.filter(s => s.type === "expense").reduce((a, s) => a + s.amount, 0)
  const netSavings = grossSaved - totalSpent
  const netPct     = grossSaved > 0 ? Math.max(0, Math.min(100, (netSavings / grossSaved) * 100)) : 0

  const totalInvested = (investment?.entries ?? []).reduce((a, e) => a + e.amount, 0)
  const goalAmount    = investment?.goalAmount ?? 0
  const invPct        = goalAmount > 0 ? Math.min(100, (totalInvested / goalAmount) * 100) : 0

  // Stacked investment segments
  const invSegments = (() => {
    if (!investment || goalAmount <= 0) return []
    let offset = 0
    return investment.entries.map((e, i) => {
      const w = Math.min((e.amount / goalAmount) * 100, 100 - offset)
      const seg = { id: e.id, left: offset, width: Math.max(0, w), color: INV_COLORS[i % INV_COLORS.length] }
      offset = Math.min(100, offset + (e.amount / goalAmount) * 100)
      return seg
    })
  })()

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-[#F5F0E8]" style={{ background: "#0C0A0B" }}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{y} · Q{q}</h1>
              <p className="text-xs opacity-35 mt-0.5">The long game.</p>
            </div>
            <button onClick={goForward} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
            </button>
            {!isCurrent && (
              <button onClick={goCurrent} className="text-xs px-3 py-1 rounded-full border transition-colors" style={{ borderColor: "rgba(212,168,83,0.4)", color: "#D4A853" }}>
                Current
              </button>
            )}
          </div>
        </div>

        {/* ── Savings ── */}
        <div className={CARD} style={CS}>
          <SectionTitle>Savings</SectionTitle>

          {/* Big number */}
          <div className="mb-4">
            <p className="text-4xl font-bold tracking-tight" style={{ color: netSavings >= 0 ? "#F5F0E8" : "#F87171" }}>
              {fmt$(netSavings)}
            </p>
            <p className="text-xs mt-1 space-x-3" style={{ color: "rgba(245,240,232,0.4)" }}>
              <span>saved {fmt$(grossSaved)}</span>
              <span>·</span>
              <span>spent {fmt$(totalSpent)}</span>
            </p>
          </div>

          {/* Visualization */}
          {grossSaved > 0 && (
            <div className="relative h-4 rounded-full overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.04)" }}>
              {/* Ghost bar - hatched - full width */}
              <div className="absolute inset-0 rounded-full" style={{
                backgroundImage: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.07), rgba(255,255,255,0.07) 3px, transparent 3px, transparent 9px)",
              }} />
              {/* Net bar */}
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{
                width: `${netPct}%`,
                background: "linear-gradient(to right, rgba(212,168,83,0.9), rgba(212,168,83,0.6))",
              }} />
            </div>
          )}

          {/* Entries */}
          <div className="space-y-1.5 mb-4">
            {savings.map(e => (
              <div key={e.id} className="flex items-center gap-3 group text-sm">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                  style={{
                    background: e.type === "saved" ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)",
                    color:      e.type === "saved" ? "#10B981" : "#F87171",
                  }}
                >
                  {e.type === "saved" ? "+" : "−"}
                </span>
                <span className="flex-1 opacity-80">{e.label}</span>
                <span className="font-medium tabular-nums">{fmt$(e.amount)}</span>
                <XBtn onClick={() => deleteSavings(e.id)} />
              </div>
            ))}
          </div>

          {/* Add form */}
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-white/[0.05]">
            <input value={sLabel} onChange={e => setSLabel(e.target.value)} placeholder="Label…" className="flex-1 min-w-24 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            <input value={sAmount} onChange={e => setSAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && addSavings()} placeholder="$0" type="number" min="0" className="w-24 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            {/* Saved / Expense toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {(["saved","expense"] as const).map(t => (
                <button key={t} onClick={() => setSType(t)} className="px-3 py-1.5 text-xs font-medium capitalize transition-all" style={{
                  background: sType === t ? (t === "saved" ? "rgba(16,185,129,0.2)" : "rgba(248,113,113,0.2)") : "transparent",
                  color:      sType === t ? (t === "saved" ? "#10B981" : "#F87171") : "rgba(245,240,232,0.4)",
                }}>{t}</button>
              ))}
            </div>
            <button onClick={addSavings} className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.3)" }}>
              Add
            </button>
          </div>
        </div>

        {/* ── Investments ── */}
        <div className={CARD} style={CS}>
          <div className="flex items-start justify-between mb-4">
            <SectionTitle>Investments</SectionTitle>
            <div className="flex items-center gap-1.5 -mt-1">
              <span className="text-xs opacity-40">Goal</span>
              <div className="flex items-center">
                <span className="text-xs opacity-40 mr-0.5">$</span>
                <input
                  type="number" min="0"
                  value={investment?.goalAmount || ""}
                  onChange={e => updateGoalAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 bg-white/[0.06] rounded-lg px-2 py-1 text-sm outline-none text-right text-[#F5F0E8] placeholder-white/20"
                />
              </div>
            </div>
          </div>

          {/* Stacked bar */}
          <div className="relative h-5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
            {goalAmount > 0 && invSegments.map(seg => (
              <div key={seg.id} className="absolute top-0 h-full transition-all duration-500" style={{
                left: `${seg.left}%`, width: `${seg.width}%`, background: seg.color,
              }} />
            ))}
            {goalAmount <= 0 && totalInvested > 0 && (
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "100%", background: INV_COLORS[0] + "80" }} />
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="font-semibold">{fmt$(totalInvested)}</span>
            {goalAmount > 0 && (
              <>
                <span className="opacity-30">of {fmt$(goalAmount)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,168,83,0.12)", color: "#D4A853" }}>
                  {invPct.toFixed(0)}%
                </span>
              </>
            )}
          </div>

          {/* Entries */}
          <div className="space-y-2 mb-4">
            {(investment?.entries ?? []).map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 group text-sm">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: INV_COLORS[i % INV_COLORS.length] }} />
                <span className="flex-1 opacity-80">{e.name}</span>
                <span className="font-medium tabular-nums">{fmt$(e.amount)}</span>
                {goalAmount > 0 && <span className="text-xs opacity-30 w-10 text-right">{((e.amount / goalAmount) * 100).toFixed(0)}%</span>}
                <XBtn onClick={() => deleteInvEntry(e.id)} />
              </div>
            ))}
          </div>

          {/* Add entry */}
          <div className="flex gap-2 pt-3 border-t border-white/[0.05]">
            <input value={iName} onChange={e => setIName(e.target.value)} placeholder="Stock / fund / portfolio…" className="flex-1 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            <input value={iAmount} onChange={e => setIAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && addInvEntry()} placeholder="$0" type="number" min="0" className="w-24 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            <button onClick={addInvEntry} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.3)" }}>
              Add
            </button>
          </div>
        </div>

        {/* ── Bigger Goals ── */}
        <div className={CARD} style={CS}>
          <SectionTitle>Bigger Goals</SectionTitle>

          <div className="space-y-5">
            {goals.map(g => (
              <div key={g.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{g.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold" style={{ color: "#D4A853" }}>{g.progress}%</span>
                    <XBtn onClick={() => deleteGoal(g.id)} />
                  </div>
                </div>
                {/* Gradient bar */}
                <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full transition-all duration-400" style={{
                    width: `${g.progress}%`,
                    background: "linear-gradient(to right, #8A2436, #D4A853)",
                  }} />
                </div>
                <input
                  type="range" min={0} max={100} value={g.progress}
                  onChange={e => updateGoalProgress(g.id, parseInt(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#D4A853" }}
                />
              </div>
            ))}
          </div>

          {/* Add goal */}
          <div className="flex gap-2 pt-4 mt-1 border-t border-white/[0.05]">
            <input value={gName} onChange={e => setGName(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal()} placeholder="Add a bigger goal…" className="flex-1 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            <button onClick={addGoal} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.3)" }}>
              Add
            </button>
          </div>
        </div>

        {/* ── Health ── */}
        <div className={CARD} style={CS}>
          <SectionTitle>Health</SectionTitle>

          <div className="space-y-4">
            {health.map(m => {
              const pct = m.goalValue > 0 ? Math.min(100, (m.currentValue / m.goalValue) * 100) : 0
              return (
                <div key={m.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={m.currentValue || ""}
                          onChange={e => updateHealthCurrent(m.id, parseFloat(e.target.value) || 0)}
                          className="w-16 text-right bg-white/[0.06] rounded px-2 py-0.5 text-sm outline-none text-[#F5F0E8]"
                        />
                        <span className="text-xs opacity-30">/ {m.goalValue}</span>
                      </div>
                      <XBtn onClick={() => deleteHealth(m.id)} />
                    </div>
                  </div>
                  {/* Pulsing green bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full health-pulse transition-all duration-400" style={{
                      width: `${pct}%`,
                      background: "linear-gradient(to right, #059669, #10B981)",
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add metric */}
          <div className="flex gap-2 flex-wrap pt-4 mt-1 border-t border-white/[0.05]">
            <input value={hName} onChange={e => setHName(e.target.value)} placeholder="Metric name…" className="flex-1 min-w-28 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            <input value={hCurrent} onChange={e => setHCurrent(e.target.value)} placeholder="Current" type="number" className="w-20 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            <input value={hGoal} onChange={e => setHGoal(e.target.value)} onKeyDown={e => e.key === "Enter" && addHealth()} placeholder="Goal" type="number" className="w-20 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]" />
            <button onClick={addHealth} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.3)" }}>
              Add
            </button>
          </div>
        </div>

        {/* ── Parking Lot ── */}
        <div className={CARD} style={CS}>
          <SectionTitle>Parking Lot</SectionTitle>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {PARKING_COLS.map(col => {
              const items = parking.filter(p => p.category === col)
              return (
                <div key={col} className="flex-shrink-0 w-44 space-y-2">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-40 leading-tight">{col}</p>
                    <button
                      onClick={() => { setAddingCol(addingCol === col ? null : col); setPText(""); setPLink("") }}
                      className="text-[#D4A853] opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>

                  {/* Inline add form */}
                  {addingCol === col && (
                    <div className="rounded-xl p-2.5 space-y-1.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <input
                        autoFocus
                        value={pText}
                        onChange={e => setPText(e.target.value)}
                        placeholder="Idea…"
                        className="w-full bg-transparent text-xs text-[#F5F0E8] outline-none placeholder-white/25"
                      />
                      <input
                        value={pLink}
                        onChange={e => setPLink(e.target.value)}
                        placeholder="Link (optional)"
                        className="w-full bg-transparent text-xs text-[#F5F0E8] outline-none placeholder-white/25 border-t border-white/10 pt-1.5"
                      />
                      <div className="flex gap-1 pt-0.5">
                        <button onClick={() => addParking(col)} className="flex-1 text-xs py-1 rounded-md font-medium" style={{ background: "rgba(212,168,83,0.2)", color: "#D4A853" }}>
                          Add
                        </button>
                        <button onClick={() => setAddingCol(null)} className="text-xs px-2 py-1 rounded-md opacity-40 hover:opacity-70" style={{ background: "rgba(255,255,255,0.08)" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cards */}
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="rounded-xl p-3 group relative"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="text-xs leading-relaxed text-[#F5F0E8] pr-4 mb-2">{item.text}</p>

                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] opacity-40 hover:opacity-80 transition-opacity mb-2">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          Link
                        </a>
                      )}

                      {/* Move to category */}
                      <select
                        value={item.category}
                        onChange={e => moveParkingItem(item.id, e.target.value)}
                        className="w-full text-[10px] rounded px-1.5 py-1 outline-none cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(245,240,232,0.5)", colorScheme: "dark" }}
                      >
                        {PARKING_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      <button onClick={() => deleteParking(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
