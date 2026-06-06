import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const weekId = req.nextUrl.searchParams.get("weekId")
  if (!weekId) return NextResponse.json({ error: "weekId required" }, { status: 400 })

  const habitDays = await prisma.habitDay.findMany({
    where: { weekId: parseInt(weekId) },
  })
  return NextResponse.json(habitDays)
}

export async function POST(req: NextRequest) {
  const { habitId, weekId, day, done } = await req.json()

  const habitDay = await prisma.habitDay.upsert({
    where: { habitId_weekId_day: { habitId, weekId, day } },
    update: { done },
    create: { habitId, weekId, day, done },
  })
  return NextResponse.json(habitDay)
}
