"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, Plus, X } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id:         number
  company:    string
  role:       string
  stage:      string
  nextAction: string | null
  link:       string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ["Researching", "Applied", "Interviewing", "Offer", "Closed"] as const

const STAGE_COLOR: Record<string, string> = {
  Researching:  "#4A6C8C",
  Applied:      "#B0823C",
  Interviewing: "#7A2230",
  Offer:        "#5B7B5A",
  Closed:       "#6E625C",
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function JobView() {
  const [jobs, setJobs] = useState<Job[]>([])

  const [company,    setCompany]    = useState("")
  const [role,       setRole]       = useState("")
  const [stage,      setStage]      = useState("Researching")
  const [nextAction, setNextAction] = useState("")
  const [link,       setLink]       = useState("")

  useEffect(() => {
    fetch("/api/jobs").then(r => r.json()).then(setJobs)
  }, [])

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const addJob = async () => {
    if (!company.trim() || !role.trim()) return
    const job: Job = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: company.trim(), role: role.trim(), stage, nextAction: nextAction.trim() || null, link: link.trim() || null }),
    }).then(r => r.json())
    setJobs(prev => [...prev, job])
    setCompany(""); setRole(""); setNextAction(""); setLink("")
  }

  const moveJob = async (id: number, newStage: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, stage: newStage } : j))
    await fetch(`/api/jobs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: newStage }) })
  }

  const deleteJob = async (id: number) => {
    setJobs(prev => prev.filter(j => j.id !== id))
    await fetch(`/api/jobs/${id}`, { method: "DELETE" })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ color: "var(--ink)" }} className="space-y-5 py-6">

      {/* ── Header ── */}
      <div className="mb-2">
        <div className="text-xs uppercase mb-1" style={{ color: "var(--ink-soft)", letterSpacing: "0.18em" }}>The pipeline</div>
        <h1 className="font-display text-3xl md:text-4xl">Job Search</h1>
      </div>

      {/* ── Add form ── */}
      <div className="rounded-2xl p-5 border" style={{ background: "var(--card)", borderColor: "var(--line)", boxShadow: "0 1px 3px rgba(40,20,24,0.05)" }}>
        <div className="flex gap-2 flex-wrap">
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company"
            className="flex-1 min-w-32 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role"
            className="flex-1 min-w-32 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="Next action"
            className="flex-1 min-w-36 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <input value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === "Enter" && addJob()} placeholder="Link (optional)"
            className="flex-1 min-w-36 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }} />
          <select value={stage} onChange={e => setStage(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
            style={{ background: "var(--paper)", color: STAGE_COLOR[stage], border: `1px solid ${STAGE_COLOR[stage]}50` }}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={addJob} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--burgundy)" }}>
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* ── Kanban — vertical grid ── */}
      <div className="grid md:grid-cols-5 gap-3">
        {STAGES.map(col => {
          const colJobs = jobs.filter(j => j.stage === col)
          const accent  = STAGE_COLOR[col]
          return (
            <div key={col}>
              {/* Column header */}
              <div className="flex items-center gap-2 pb-2 mb-2" style={{ borderBottom: `2px solid ${accent}40` }}>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{col}</span>
                {colJobs.length > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: `${accent}18`, color: accent }}>
                    {colJobs.length}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colJobs.map(job => (
                  <div key={job.id} className="rounded-xl p-3 group"
                    style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(40,20,24,0.05)" }}>
                    <div className="mb-1.5">
                      <p className="text-sm font-semibold leading-snug">{job.company}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>{job.role}</p>
                    </div>

                    {job.nextAction && (
                      <p className="text-[11px] leading-relaxed mb-1.5" style={{ color: "var(--ink-soft)" }}>
                        <span style={{ color: accent }}>→</span> {job.nextAction}
                      </p>
                    )}

                    {job.link && (
                      <a href={job.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[11px] mb-1.5 hover:opacity-80"
                        style={{ color: "var(--ink-soft)", opacity: 0.6 }}>
                        <ArrowUpRight size={12} />
                        {(() => { try { return new URL(job.link).hostname.replace("www.", "") } catch { return "Link" } })()}
                      </a>
                    )}

                    <div className="flex items-center gap-1 pt-1.5" style={{ borderTop: "1px solid var(--line)" }}>
                      <select value={job.stage} onChange={e => moveJob(job.id, e.target.value)}
                        className="flex-1 text-xs rounded-md px-1.5 py-1 outline-none cursor-pointer"
                        style={{ background: "var(--paper)", color: accent, border: `1px solid ${accent}35` }}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => deleteJob(job.id)}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity shrink-0"
                        style={{ background: "var(--paper)", color: "var(--ink-soft)" }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {colJobs.length === 0 && (
                  <div className="rounded-xl h-14 flex items-center justify-center"
                    style={{ border: `1px dashed ${accent}30` }}>
                    <span className="text-[11px]" style={{ color: `${accent}60` }}>empty</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
