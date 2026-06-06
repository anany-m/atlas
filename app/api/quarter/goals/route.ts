import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = parseInt(req.nextUrl.searchParams.get("q") ?? "1")
  const y = parseInt(req.nextUrl.searchParams.get("y") ?? String(new Date().getFullYear()))
  const goals = await prisma.quarterGoal.findMany({ where: { quarter: q, year: y }, orderBy: { id: "asc" } })
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest) {
  const { name, quarter, year } = await req.json()
  const goal = await prisma.quarterGoal.create({ data: { name, quarter, year } })
  return NextResponse.json(goal)
}
