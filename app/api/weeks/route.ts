import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const monday = req.nextUrl.searchParams.get("monday")
  if (!monday) return NextResponse.json({ error: "monday required" }, { status: 400 })

  const date = new Date(monday)

  let week = await prisma.week.findUnique({
    where: { monday: date },
    include: { goals: true, tasks: true, chores: true },
  })

  if (!week) {
    week = await prisma.week.create({
      data: { monday: date },
      include: { goals: true, tasks: true, chores: true },
    })
  }

  return NextResponse.json(week)
}
