"use client"

import { useState, useEffect, useRef } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BucketItem {
  id:       number
  title:    string
  category: string
  progress: number
  achieved: boolean
  photoUrl: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Travel", "Career", "Experiences", "Personal"] as const
type Category = typeof CATEGORIES[number]

const CAT: Record<Category, { accent: string; gradient: string }> = {
  Travel:      { accent: "#3B82F6", gradient: "linear-gradient(135deg,#1a3060,#1d4ed8)" },
  Career:      { accent: "#D4A853", gradient: "linear-gradient(135deg,#581621,#8A2436)" },
  Experiences: { accent: "#F97316", gradient: "linear-gradient(135deg,#431407,#92400e)" },
  Personal:    { accent: "#A78BFA", gradient: "linear-gradient(135deg,#2d1a5e,#5b21b6)" },
}

function catStyle(category: string) {
  return CAT[category as Category] ?? CAT.Travel
}

// ─── Image compression ────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 900
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round((h * MAX) / w); w = MAX }
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.78))
    }
    img.src = url
  })
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const COLORS = ["#D4A853","#8A2436","#3B82F6","#F97316","#A78BFA","#10B981"]
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <div
          key={i}
          className="absolute bottom-0 confetti-particle"
          style={{
            left:              `${5 + (i / 36) * 90 + (i % 5)}%`,
            width:             6 + (i % 3) * 2,
            height:            8 + (i % 4) * 3,
            background:        COLORS[i % COLORS.length],
            borderRadius:      i % 3 === 0 ? "50%" : 2,
            animationDelay:    `${(i % 8) * 0.07}s`,
            animationDuration: `${1.4 + (i % 5) * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BucketView() {
  const [items,          setItems]          = useState<BucketItem[]>([])
  const [filter,         setFilter]         = useState("All")
  const [celebrationKey, setCelebrationKey] = useState(0)

  // Add form
  const [adding,       setAdding]       = useState(false)
  const [newTitle,     setNewTitle]     = useState("")
  const [newCategory,  setNewCategory]  = useState<Category>("Travel")

  const progressTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const fileRefs       = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch("/api/bucket").then(r => r.json()).then(setItems)
  }, [])

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const addItem = async () => {
    if (!newTitle.trim()) return
    const item: BucketItem = await fetch("/api/bucket", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), category: newCategory }),
    }).then(r => r.json())
    setItems(prev => [...prev, item])
    setNewTitle(""); setAdding(false)
  }

  const updateProgress = (id: number, progress: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, progress } : i))
    if (progressTimers.current[id]) clearTimeout(progressTimers.current[id])
    progressTimers.current[id] = setTimeout(() =>
      fetch(`/api/bucket/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      }),
    400)
  }

  const markAchieved = async (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, achieved: true, progress: 100 } : i))
    setCelebrationKey(k => k + 1)
    await fetch(`/api/bucket/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achieved: true, progress: 100 }),
    })
  }

  const handlePhotoUpload = async (id: number, file: File) => {
    const photoUrl = await compressImage(file)
    setItems(prev => prev.map(i => i.id === id ? { ...i, photoUrl } : i))
    await fetch(`/api/bucket/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl }),
    })
  }

  const removePhoto = async (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, photoUrl: null } : i))
    await fetch(`/api/bucket/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: null }),
    })
  }

  const deleteItem = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/bucket/${id}`, { method: "DELETE" })
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const filtered = filter === "All" ? items : items.filter(i => i.category === filter)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-[#F5F0E8]" style={{ background: "#0C0A0B" }}>
      {celebrationKey > 0 && <Confetti key={celebrationKey} />}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight">The Bucket List.</h1>
          <p className="text-[11px] mt-1.5 uppercase tracking-widest" style={{ color: "rgba(245,240,232,0.3)" }}>
            Magnum Opus.
          </p>
        </div>

        {/* Filter chips + new item */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["All", ...CATEGORIES].map(cat => {
            const accent = CAT[cat as Category]?.accent
            const active = filter === cat
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: active ? (accent ? `${accent}22` : "rgba(212,168,83,0.12)") : "rgba(255,255,255,0.04)",
                  color:      active ? (accent ?? "#D4A853")                               : "rgba(245,240,232,0.4)",
                  border:     `1px solid ${active ? (accent ? `${accent}55` : "rgba(212,168,83,0.4)") : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {cat}
              </button>
            )
          })}

          <button
            onClick={() => { setAdding(true); setNewTitle("") }}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{ background: "rgba(212,168,83,0.12)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.3)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New item
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="rounded-2xl p-5 mb-6 border" style={{ background: "rgba(212,168,83,0.04)", borderColor: "rgba(212,168,83,0.2)" }}>
            <p className="text-[11px] uppercase tracking-widest opacity-50 font-semibold mb-4">New bucket list item</p>
            <div className="flex gap-3 flex-wrap">
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
                placeholder="What's on your list?"
                className="flex-1 min-w-48 bg-white/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none placeholder-white/20 text-[#F5F0E8]"
              />
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewCategory(c)}
                    className="px-3 py-2.5 text-xs font-medium transition-all"
                    style={{
                      background: newCategory === c ? `${CAT[c].accent}22` : "transparent",
                      color:      newCategory === c ? CAT[c].accent         : "rgba(245,240,232,0.4)",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button onClick={addItem} className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.3)" }}>
                Add
              </button>
              <button onClick={() => setAdding(false)} className="px-3 py-2.5 rounded-xl text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.4)" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const col = catStyle(item.category)
            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden group flex flex-col"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Hidden file input */}
                <input
                  ref={r => { fileRefs.current[item.id] = r }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      handlePhotoUpload(item.id, e.target.files[0])
                      e.target.value = ""
                    }
                  }}
                />

                {/* Hero */}
                <div className="relative h-44 flex-shrink-0 overflow-hidden">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: col.gradient }} />
                  )}

                  {/* Achieved stamp */}
                  {item.achieved && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
                    >
                      <span className="text-5xl leading-none">🏁</span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                        style={{ color: col.accent, background: `${col.accent}25`, border: `1px solid ${col.accent}50` }}
                      >
                        Achieved
                      </span>
                    </div>
                  )}

                  {/* Bottom scrim */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78), transparent)" }}
                  />

                  {/* Category pill */}
                  <div
                    className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background:    `${col.accent}28`,
                      color:         col.accent,
                      border:        `1px solid ${col.accent}50`,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {item.category}
                  </div>

                  {/* Title */}
                  <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white leading-snug">
                    {item.title}
                  </p>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3 flex-1">

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-medium" style={{ color: "rgba(245,240,232,0.4)" }}>Progress</p>
                      <p className="text-[11px] font-semibold" style={{ color: col.accent }}>{item.progress}%</p>
                    </div>

                    {/* Glow bar */}
                    <div className="h-1.5 rounded-full overflow-visible mb-2" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width:     `${item.progress}%`,
                          background: col.accent,
                          boxShadow:  item.progress > 0 ? `0 0 8px ${col.accent}, 0 0 18px ${col.accent}70` : "none",
                        }}
                      />
                    </div>

                    <input
                      type="range" min={0} max={100} value={item.progress}
                      onChange={e => updateProgress(item.id, parseInt(e.target.value))}
                      disabled={item.achieved}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                      style={{ accentColor: col.accent }}
                    />
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 mt-auto">
                    {!item.achieved ? (
                      <button
                        onClick={() => markAchieved(item.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: `${col.accent}18`,
                          color:       col.accent,
                          border:      `1px solid ${col.accent}45`,
                        }}
                      >
                        🏁 Mark achieved
                      </button>
                    ) : (
                      <div className="flex-1 py-2 text-center text-xs opacity-30">🏁 Done</div>
                    )}

                    {item.photoUrl ? (
                      <button
                        onClick={() => removePhoto(item.id)}
                        className="py-2 px-3 rounded-xl text-xs transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(245,240,232,0.4)", border: "1px solid rgba(255,255,255,0.09)" }}
                        title="Remove photo"
                      >
                        ✕ photo
                      </button>
                    ) : (
                      <button
                        onClick={() => fileRefs.current[item.id]?.click()}
                        className="py-2 px-3 rounded-xl text-xs transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(245,240,232,0.45)", border: "1px solid rgba(255,255,255,0.09)" }}
                        title="Add photo"
                      >
                        📷 photo
                      </button>
                    )}

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 rounded-xl transition-opacity opacity-0 group-hover:opacity-25 hover:!opacity-60"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                      title="Delete"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-28 gap-3" style={{ color: "rgba(245,240,232,0.18)" }}>
            <span className="text-5xl">🪣</span>
            <p className="text-sm">
              {filter === "All" ? "Nothing on the list yet." : `No ${filter} items yet.`}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
