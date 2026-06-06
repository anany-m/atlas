"use client"

import { useState, useEffect } from "react"

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
  Researching:  "#7A7F8C",
  Applied:      "#4A8FBB",
  Interviewing: "#B0823C",
  Offer:        "#2E8B57",
  Closed:       "#6B7280",
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
      body: JSON.stringify({
        company:    company.trim(),
        role:       role.trim(),
        stage,
        nextAction: nextAction.trim() || null,
        link:       link.trim() || null,
      }),
    }).then(r => r.json())
    setJobs(prev => [...prev, job])
    setCompany(""); setRole(""); setNextAction(""); setLink("")
  }

  const moveJob = async (id: number, newStage: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, stage: newStage } : j))
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    })
  }

  const deleteJob = async (id: number) => {
    setJobs(prev => prev.filter(j => j.id !== id))
    await fetch(`/api/jobs/${id}`, { method: "DELETE" })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ color: "var(--ink)" }}>
      <div className="max-w-[1200px] mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-fraunces, serif)" }}>Job Search.</h1>
          <p className="text-[11px] mt-1.5 uppercase tracking-widest" style={{ color: "var(--ink-soft)" }}>
            the pipeline.
          </p>
        </div>

        {/* Add form */}
        <div
          className="rounded-2xl p-5 mb-8 border"
          style={{ background: "var(--card)", borderColor: "var(--line)" }}
        >
          <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: "var(--ink-soft)" }}>Add to pipeline</p>
          <div className="flex gap-3 flex-wrap">
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Company"
              className="flex-1 min-w-32 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}
            />
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Role"
              className="flex-1 min-w-32 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}
            />
            <input
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              placeholder="Next action"
              className="flex-1 min-w-36 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}
            />
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addJob()}
              placeholder="Link (optional)"
              className="flex-1 min-w-36 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}
            />
            {/* Stage selector */}
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
              style={{
                background: "var(--paper)",
                color:      STAGE_COLOR[stage],
                border:     `1px solid ${STAGE_COLOR[stage]}50`,
              }}
            >
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={addJob}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--burgundy)" }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Kanban board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(col => {
            const colJobs = jobs.filter(j => j.stage === col)
            const accent  = STAGE_COLOR[col]
            return (
              <div key={col} className="flex-shrink-0 w-56 flex flex-col gap-3">

                {/* Column header */}
                <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `2px solid ${accent}50` }}>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: accent }}
                  >
                    {col}
                  </span>
                  {colJobs.length > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                      style={{ background: `${accent}18`, color: accent }}
                    >
                      {colJobs.length}
                    </span>
                  )}
                </div>

                {/* Cards */}
                {colJobs.map(job => (
                  <div
                    key={job.id}
                    className="rounded-xl p-3.5 group flex flex-col gap-2.5"
                    style={{ background: "var(--card)", border: "1px solid var(--line)" }}
                  >
                    {/* Company + role */}
                    <div>
                      <p className="text-sm font-semibold leading-snug">{job.company}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>{job.role}</p>
                    </div>

                    {/* Next action */}
                    {job.nextAction && (
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                        <span style={{ color: accent }}>→</span> {job.nextAction}
                      </p>
                    )}

                    {/* Link */}
                    {job.link && (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] transition-opacity hover:opacity-100"
                        style={{ color: "var(--ink-soft)", opacity: 0.6 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        {(() => { try { return new URL(job.link).hostname.replace("www.", "") } catch { return "Link" } })()}
                      </a>
                    )}

                    {/* Move + delete */}
                    <div className="flex items-center gap-2 pt-0.5" style={{ borderTop: "1px solid var(--line)" }}>
                      <select
                        value={job.stage}
                        onChange={e => moveJob(job.id, e.target.value)}
                        className="flex-1 text-[11px] rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                        style={{
                          background: "var(--paper)",
                          color:      accent,
                          border:     `1px solid ${accent}35`,
                        }}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <button
                        onClick={() => deleteJob(job.id)}
                        className="p-1.5 rounded-lg flex-shrink-0 opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity"
                        style={{ background: "var(--paper)", color: "var(--ink)" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty column hint */}
                {colJobs.length === 0 && (
                  <div
                    className="rounded-xl h-16 flex items-center justify-center"
                    style={{ border: `1px dashed ${accent}40` }}
                  >
                    <span className="text-[11px]" style={{ color: `${accent}70` }}>empty</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
