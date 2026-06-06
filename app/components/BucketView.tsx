"use client"

import { useState, useEffect, useRef } from "react"
import { Flag, ImagePlus, Trash2, Plus } from "lucide-react"

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

const BUCKET_COLOR: Record<Category, string> = {
  Travel:      "#4A6C8C",
  Career:      "#7A2230",
  Experiences: "#B0823C",
  Personal:    "#6B4FA0",
}

function catColor(category: string): string {
  return BUCKET_COLOR[category as Category] ?? "#4A6C8C"
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color, backgroundColor: `${color}1F` }}>
      {children}
    </span>
  )
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BucketView() {
  const [items,       setItems]       = useState<BucketItem[]>([])
  const [filter,      setFilter]      = useState("All")
  const [newTitle,    setNewTitle]    = useState("")
  const [newCategory, setNewCategory] = useState<Category>("Travel")

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
    setNewTitle("")
  }

  const updateProgress = (id: number, progress: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, progress } : i))
    if (progressTimers.current[id]) clearTimeout(progressTimers.current[id])
    progressTimers.current[id] = setTimeout(() =>
      fetch(`/api/bucket/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress }) }), 400)
  }

  const markAchieved = async (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, achieved: true, progress: 100 } : i))
    window.dispatchEvent(new CustomEvent("f1-celebrate"))
    await fetch(`/api/bucket/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ achieved: true, progress: 100 }) })
  }

  const handlePhotoUpload = async (id: number, file: File) => {
    const photoUrl = await compressImage(file)
    setItems(prev => prev.map(i => i.id === id ? { ...i, photoUrl } : i))
    await fetch(`/api/bucket/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoUrl }) })
  }

  const removePhoto = async (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, photoUrl: null } : i))
    await fetch(`/api/bucket/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoUrl: null }) })
  }

  const deleteItem = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/bucket/${id}`, { method: "DELETE" })
  }

  const filtered = filter === "All" ? items : items.filter(i => i.category === filter)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ color: "var(--ink)" }} className="space-y-5 py-6">

      {/* ── Header ── */}
      <div className="mb-2">
        <div className="text-xs uppercase mb-1" style={{ color: "var(--ink-soft)", letterSpacing: "0.18em" }}>Magnum opus</div>
        <h1 className="font-display text-3xl md:text-4xl">The Bucket List</h1>
      </div>

      {/* ── Add form ── */}
      <div className="rounded-2xl p-5 border" style={{ background: "var(--card)", borderColor: "var(--line)", boxShadow: "0 1px 3px rgba(40,20,24,0.05)" }}>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addItem()}
            placeholder="A thing you want to do, see, or become…"
            className="flex-1 min-w-0 text-sm rounded-lg px-3 py-2 outline-none"
            style={{ backgroundColor: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}
          />
          <select value={newCategory} onChange={e => setNewCategory(e.target.value as Category)}
            className="text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
            style={{ backgroundColor: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink)" }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={addItem} className="flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--burgundy)" }}>
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...CATEGORIES].map(c => {
          const color  = BUCKET_COLOR[c as Category]
          const active = filter === c
          return (
            <button key={c} onClick={() => setFilter(c)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{
                backgroundColor: active ? (color ?? "var(--burgundy)") : "var(--card)",
                color:           active ? "#fff" : "var(--ink-soft)",
                border:          "1px solid var(--line)",
              }}>
              {c}
            </button>
          )
        })}
      </div>

      {/* ── Grid ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(item => {
          const color = catColor(item.category)
          return (
            <div key={item.id} className="rounded-2xl overflow-hidden group relative"
              style={{ border: "1px solid var(--line)", backgroundColor: "var(--card)", boxShadow: "0 1px 3px rgba(40,20,24,0.05)" }}>

              {/* Hidden file input */}
              <input ref={r => { fileRefs.current[item.id] = r }} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) { handlePhotoUpload(item.id, e.target.files[0]); e.target.value = "" } }} />

              {/* Top: photo hero or thin color bar */}
              {item.photoUrl ? (
                <div className="relative h-44 overflow-hidden">
                  <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover" />
                  {item.achieved && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
                      <span className="text-4xl leading-none">🏁</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: 6, backgroundColor: color }} />
              )}

              <div className="p-5">
                {!item.photoUrl && <Pill color={color}>{item.category}</Pill>}

                <h3 className="font-display text-xl mt-2 mb-3 leading-snug"
                  style={{ textDecoration: item.achieved ? "line-through" : "none", color: "var(--ink)", opacity: item.achieved ? 0.6 : 1 }}>
                  {item.title}
                </h3>

                {/* Progress */}
                <div className="mb-3">
                  <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 10, backgroundColor: "var(--line)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${item.progress}%`, background: `linear-gradient(90deg, ${color}, var(--gold))` }} />
                  </div>
                  <input type="range" className="slider w-full" min={0} max={100} value={item.progress}
                    onChange={e => updateProgress(item.id, parseInt(e.target.value))}
                    disabled={item.achieved} style={{ accentColor: color }} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => !item.achieved && markAchieved(item.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      backgroundColor: item.achieved ? color : "transparent",
                      color:           item.achieved ? "#fff" : color,
                      border:          `1px solid ${color}`,
                    }}>
                    <Flag size={12} /> {item.achieved ? "Achieved!" : "Mark achieved"}
                  </button>

                  {!item.photoUrl ? (
                    <button onClick={() => fileRefs.current[item.id]?.click()}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                      style={{ background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                      <ImagePlus size={12} /> Photo
                    </button>
                  ) : (
                    <button onClick={() => removePhoto(item.id)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{ background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                      Remove photo
                    </button>
                  )}

                  <button onClick={() => deleteItem(item.id)}
                    className="ml-auto p-1.5 rounded-full opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity"
                    style={{ color: "var(--ink-soft)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 gap-3" style={{ color: "var(--ink-soft)", opacity: 0.45 }}>
          <span className="text-5xl">🪣</span>
          <p className="text-sm">{filter === "All" ? "Nothing on the list yet." : `No ${filter} items yet.`}</p>
        </div>
      )}
    </div>
  )
}
