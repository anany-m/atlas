import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const habits = await prisma.habit.findMany({ orderBy: { id: "asc" } })
  return NextResponse.json(habits)
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  const habit = await prisma.habit.create({ data: { name } })
  return NextResponse.json(habit)
}
