import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toHHMM(t: Date | string | unknown): string {
  if (typeof t === "string") return String(t).substring(0, 5)
  if (t instanceof Date)
    return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`
  return "00:00"
}

function serialize(e: {
  id: number; date: Date | string; startTime: Date | string; endTime: Date | string
  title: string; category: string
}) {
  return {
    id:        e.id,
    date:      e.date instanceof Date ? e.date.toISOString().split("T")[0] : String(e.date).substring(0, 10),
    startTime: toHHMM(e.startTime),
    endTime:   toHHMM(e.endTime),
    title:     e.title,
    category:  e.category,
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 })

  const events = await prisma.event.findMany({
    where: { date: new Date(date) },
    orderBy: { startTime: "asc" },
  })
  return NextResponse.json(events.map(serialize))
}

export async function POST(req: NextRequest) {
  const { date, startTime, endTime, title, category } = await req.json()

  const event = await prisma.event.create({
    data: {
      date:      new Date(date),
      startTime: new Date(`1970-01-01T${startTime}:00.000Z`),
      endTime:   new Date(`1970-01-01T${endTime}:00.000Z`),
      title,
      category,
    },
  })
  return NextResponse.json(serialize(event))
}
