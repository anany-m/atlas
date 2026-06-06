"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, PiggyBank, TrendingUp, Target, HeartPulse, Lightbulb, Plus, X } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavingsEntry { id: number; label: string; amount: number; type: "saved" | "expense" }
interface InvEntry     { id: number; name: string; amount: number; investmentId: number }
interface Investment   { id: number; goalAmount: number; entries: InvEntry[] }
interface QuarterGoal  { id: number; name: string; progress: number }
interface HealthMetric { id: number; name: string; currentValue: number; goalValue: number }
interface ParkingItem  { id: number; text: string; category: string; link: string | null }

// ─── Constants ────────────────────────────────────────────────────────────────

const RING_COLORS   = ["#7A2230", "#B0823C", "#4A6C8C", "#5B7B5A", "#B5663F", "#6B4FA0"]
const INV_COLORS    = ["#7A2230", "#B0823C", "#4A6C8C", "#5B7B5A", "#B5663F", "#6B4FA0", "#C96E3F", "#8A5BAA"]
const PARKING_COLS  = ["Add to Cart", "Health & Wellbeing", "Leisure", "Interested", "Money Matters", "Random"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentQY(): { q: number; y: number } {
  const now = new Date()
  return { q: Math.ceil((now.getMonth() + 1) / 3), y: now.getFullYear() }
}

function prevQY(q: number, y: number) { return q === 1 ? { q: 4, y: y - 1 } : { q: q - 1, y } }
function nextQY(q: number, y: number) { return q === 4 ? { q: 1, y: y + 1 } : { q: q + 1, y } }

function fmt$(n: number): string {
  const abs  = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)
}

// ─── Shared card style ────────────────────────────────────────────────────────

const CARD = "rounded-2xl p-5 border"
const CS   = { background: "var(--card)", borderColor: "var(--line)", boxShadow: "0 1px 3px rgba(40,20,24,0.05)" }

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

  const [sLabel,  setSLabel]  = useState("")
  const [sAmount, setSAmount] = useState("")
  const [sType,   setSType]   = useState<"saved"|"expense">("saved")

  const [iName,   setIName]   = useState("")
  const [iAmount, setIAmount] = useState("")

  const [gName, setGName] = useState("")

  const [hName,    setHName]    = useState("")
  const [hCurrent, setHCurrent] = useState("")
  const [hGoal,    setHGoal]    = useState("")

  const [addingCol, setAddingCol] = useState<string | null>(null)
  const [pText,     setPText]     = useState("")
  const [pLink,     setPLink]     = useState("")

  const goalTimers   = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const healthTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const invGoalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const qs = `q=${q}&y=${y}`

  useEffect(() => {
    fetch(`/api/quarter/savings?${qs}`).then(r => r.json()).then(setSavings)
    fetch(`/api/quarter/investment?${qs}`).then(r => r.json()).then(setInvestment)
    fetch(`/api/quarter/goals?${qs}`).then(r => r.json()).then(setGoals)
    fetch(`/api/quarter/health?${qs}`).then(r => r.json()).then(setHealth)
    fetch(`/api/quarter/parking-lot?${qs}`).then(r => r.json()).then(setParking)
  }, [q, y]) // eslint-disable-line react-hooks/exhaustive-deps

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
      fetch(`/api/quarter/investment?${qs}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goalAmount: val }) }), 500)
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
      fetch(`/api/quarter/goals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress }) }), 400)
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
      fetch(`/api/quarter/health/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentValue }) }), 400)
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

  const grossSaved    = savings.filter(s => s.type === "saved").reduce((a, s) => a + s.amount, 0)
  const totalSpent    = savings.filter(s => s.type === "expense").reduce((a, s) => a + s.amount, 0)
  const netSavings    = grossSaved - totalSpent
  const netPct        = grossSaved > 0 ? Math.max(0, Math.min(100, (netSavings / grossSaved) * 100)) : 0
  const totalInvested = (investment?.entries ?? []).reduce((a, e) => a + e.amount, 0)
  const goalAmount    = investment?.goalAmount ?? 0
  const invPct        = goalAmount > 0 ? Math.min(100, (totalInvested / goalAmount) * 100) : 0

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ color: "var(--ink)" }} className="space-y-5 py-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div>
          <div className="text-xs uppercase mb-1" style={{ color: "var(--ink-soft)", letterSpacing: "0.18em" }}>The long game</div>
          <h1 className="font-display text-3xl md:text-4xl">{y} · Q{q}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 rounded-lg" style={{ border: "1px solid var(--line)", backgroundColor: "var(--card)", color: "var(--ink-soft)" }}>
            <ChevronLeft size={18} />
          </button>
          {!isCurrent && (
            <button onClick={goCurrent} className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ border: "1px solid var(--line)", color: "var(--burgundy)", backgroundColor: "var(--card)" }}>
              Current
            </button>
          )}
          <button onClick={goForward} className="p-2 rounded-lg" style={{ border: "1px solid var(--line)", backgroundColor: "var(--card)", color: "var(--ink-soft)" }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Savings + Investments (2-col) ── */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Savings */}
        <div className={CARD} style={CS}>
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank size={17} style={{ color: "var(--burgundy)" }} />
            <span className="font-display text-lg">Savings</span>
          </div>

          <p className="font-display text-4xl mb-1" style={{ color: netSavings >= 0 ? "var(--ink)" : "#DC2626" }}>
            {fmt$(netSavings)}
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
            <span>saved {fmt$(grossSaved)}</span>
            <span className="mx-2">·</span>
            <span>spent {fmt$(totalSpent)}</span>
          </p>

          {grossSaved > 0 && (
            <div className="relative rounded-full overflow-hidden mb-4" style={{ height: 22, backgroundColor: "var(--line)" }}>
              <div className="absolute inset-0 ghost-fill" style={{ width: "100%" }} />
              <div className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
                style={{ width: `${netPct}%`, backgroundColor: "var(--burgundy)" }} />
            </div>
          )}

          <div className="space-y-1.5 mb-4">
            {savings.map(e => (
              <div key={e.id} className="flex items-center gap-3 group text-sm">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                  style={{ background: e.type === "saved" ? "rgba(16,185,129,0.12)" : "rgba(220,38,38,0.1)", color: e.type === "saved" ? "#059669" : "#DC2626" }}>
                  {e.type === "saved" ? "+" : "−"}
                </span>
                <span className="flex-1" style={{ color: "var(--ink-soft)" }}>{e.label}</span>
                <span className="font-medium tabular-nums">{fmt$(e.amount)}</span>
                <button onClick={() => deleteSavings(e.id)} className="opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity shrink-0" style={{ color: "var(--ink-soft)" }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-3" style={{ borderTop: "1px solid var(--line)" }}>
            <input value={sLabel} onChange={e => setSLabel(e.target.value)} placeholder="Label…"
              className="flex-1 min-w-24 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
            <input value={sAmount} onChange={e => setSAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && addSavings()} placeholder="$0" type="number" min="0"
              className="w-20 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              {(["saved","expense"] as const).map(t => (
                <button key={t} onClick={() => setSType(t)} className="px-3 py-1.5 text-xs font-medium capitalize transition-all"
                  style={{ background: sType === t ? (t === "saved" ? "rgba(16,185,129,0.15)" : "rgba(220,38,38,0.1)") : "transparent", color: sType === t ? (t === "saved" ? "#059669" : "#DC2626") : "var(--ink-soft)" }}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={addSavings} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--burgundy)" }}>Add</button>
          </div>
        </div>

        {/* Investments */}
        <div className={CARD} style={CS}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={17} style={{ color: "var(--burgundy)" }} />
              <span className="font-display text-lg">Investments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "var(--ink-soft)" }}>Goal $</span>
              <input type="number" min="0" value={investment?.goalAmount || ""}
                onChange={e => updateGoalAmount(parseFloat(e.target.value) || 0)} placeholder="0"
                className="w-20 rounded-lg px-2 py-1 text-sm outline-none text-right"
                style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
            </div>
          </div>

          <div className="rounded-full overflow-hidden mb-3 flex" style={{ height: 22, backgroundColor: "var(--line)" }}>
            {goalAmount > 0 && (investment?.entries ?? []).map((e, i) => (
              <div key={e.id} title={`${e.name}: ${fmt$(e.amount)}`}
                style={{ width: `${Math.max(0, Math.min((e.amount / goalAmount) * 100, 100))}%`, backgroundColor: INV_COLORS[i % INV_COLORS.length], transition: "width .2s" }} />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="font-display text-xl">{fmt$(totalInvested)}</span>
            {goalAmount > 0 && (
              <>
                <span style={{ color: "var(--ink-soft)" }}>of {fmt$(goalAmount)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,34,48,0.1)", color: "var(--burgundy)" }}>
                  {invPct.toFixed(0)}%
                </span>
              </>
            )}
          </div>

          <div className="space-y-2 mb-4">
            {(investment?.entries ?? []).map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 group text-sm">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: INV_COLORS[i % INV_COLORS.length] }} />
                <span className="flex-1" style={{ color: "var(--ink-soft)" }}>{e.name}</span>
                <span className="font-medium tabular-nums">{fmt$(e.amount)}</span>
                <button onClick={() => deleteInvEntry(e.id)} className="opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity shrink-0" style={{ color: "var(--ink-soft)" }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
            <input value={iName} onChange={e => setIName(e.target.value)} placeholder="Stock / fund / portfolio…"
              className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
            <input value={iAmount} onChange={e => setIAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && addInvEntry()} placeholder="$0" type="number" min="0"
              className="w-24 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
            <button onClick={addInvEntry} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--burgundy)" }}>Add</button>
          </div>
        </div>
      </div>

      {/* ── Bigger Goals ── */}
      <div className={CARD} style={CS}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={17} style={{ color: "var(--burgundy)" }} />
          <span className="font-display text-lg">Bigger Goals</span>
        </div>

        <div className="space-y-5">
          {goals.map((g, idx) => {
            const color = RING_COLORS[idx % RING_COLORS.length]
            return (
              <div key={g.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{g.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold" style={{ color }}>{g.progress}%</span>
                    <button onClick={() => deleteGoal(g.id)} className="opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity shrink-0" style={{ color: "var(--ink-soft)" }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 10, backgroundColor: "var(--line)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${g.progress}%`, background: `linear-gradient(90deg, ${color}, var(--gold))` }} />
                </div>
                <input type="range" min={0} max={100} value={g.progress}
                  onChange={e => updateGoalProgress(g.id, parseInt(e.target.value))}
                  className="slider w-full mt-1" style={{ accentColor: color }} />
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 pt-4 mt-1" style={{ borderTop: "1px solid var(--line)" }}>
          <input value={gName} onChange={e => setGName(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal()} placeholder="Add a bigger goal…"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <button onClick={addGoal} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--burgundy)" }}>Add</button>
        </div>
      </div>

      {/* ── Health ── */}
      <div className={CARD} style={CS}>
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse size={17} style={{ color: "var(--burgundy)" }} />
          <span className="font-display text-lg">Health</span>
        </div>

        <div className="space-y-4">
          {health.map(m => {
            const pct = m.goalValue > 0 ? Math.min(100, (m.currentValue / m.goalValue) * 100) : 0
            return (
              <div key={m.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <input type="number" value={m.currentValue || ""}
                        onChange={e => updateHealthCurrent(m.id, parseFloat(e.target.value) || 0)}
                        className="w-16 text-right rounded-md px-2 py-1 text-xs outline-none"
                        style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
                      <span className="text-xs" style={{ color: "var(--ink-soft)" }}>/ {m.goalValue}</span>
                    </div>
                    <button onClick={() => deleteHealth(m.id)} className="opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity shrink-0" style={{ color: "var(--ink-soft)" }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 12, backgroundColor: "var(--line)" }}>
                  <div className="h-full pulse-fill rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: "#5B7B5A" }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 flex-wrap pt-4 mt-1" style={{ borderTop: "1px solid var(--line)" }}>
          <input value={hName} onChange={e => setHName(e.target.value)} placeholder="Metric name…"
            className="flex-1 min-w-28 rounded-lg px-3 py-1.5 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <input value={hCurrent} onChange={e => setHCurrent(e.target.value)} placeholder="Current" type="number"
            className="w-20 rounded-lg px-3 py-1.5 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <input value={hGoal} onChange={e => setHGoal(e.target.value)} onKeyDown={e => e.key === "Enter" && addHealth()} placeholder="Goal" type="number"
            className="w-20 rounded-lg px-3 py-1.5 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <button onClick={addHealth} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--burgundy)" }}>Add</button>
        </div>
      </div>

      {/* ── Parking Lot ── */}
      <div className={CARD} style={CS}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={17} style={{ color: "var(--burgundy)" }} />
          <span className="font-display text-lg">Parking Lot</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PARKING_COLS.map(col => {
            const items = parking.filter(p => p.category === col)
            return (
              <div key={col}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>{col}</p>
                  <button onClick={() => { setAddingCol(addingCol === col ? null : col); setPText(""); setPLink("") }}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: "var(--burgundy)" }}>
                    <Plus size={13} />
                  </button>
                </div>

                {addingCol === col && (
                  <div className="rounded-xl p-2.5 space-y-1.5 mb-2" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
                    <input autoFocus value={pText} onChange={e => setPText(e.target.value)} placeholder="Idea…"
                      className="w-full bg-transparent text-xs outline-none" style={{ color: "var(--ink)" }} />
                    <input value={pLink} onChange={e => setPLink(e.target.value)} placeholder="Link (optional)"
                      className="w-full bg-transparent text-xs outline-none pt-1.5"
                      style={{ borderTop: "1px solid var(--line)", color: "var(--ink)" }} />
                    <div className="flex gap-1 pt-0.5">
                      <button onClick={() => addParking(col)} className="flex-1 text-xs py-1 rounded-md font-medium text-white" style={{ background: "var(--burgundy)" }}>Add</button>
                      <button onClick={() => setAddingCol(null)} className="text-xs px-2 py-1 rounded-md" style={{ background: "var(--line)", color: "var(--ink-soft)" }}>✕</button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="rounded-xl p-3 group relative" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
                      <p className="text-xs leading-relaxed pr-5 mb-1.5" style={{ color: "var(--ink)" }}>{item.text}</p>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] mb-1.5 hover:opacity-80" style={{ color: "var(--ink-soft)", opacity: 0.55 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          Link
                        </a>
                      )}
                      <select value={item.category} onChange={e => moveParkingItem(item.id, e.target.value)}
                        className="w-full text-[10px] rounded px-1.5 py-1 outline-none cursor-pointer"
                        style={{ background: "var(--card)", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                        {PARKING_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={() => deleteParking(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity" style={{ color: "var(--ink-soft)" }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
