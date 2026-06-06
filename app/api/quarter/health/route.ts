import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toNum(v: unknown): number { return parseFloat(String(v)) || 0 }
const ser = (m: { id: number; name: string; currentValue: unknown; goalValue: unknown; quarter: number; year: number }) =>
  ({ ...m, currentValue: toNum(m.currentValue), goalValue: toNum(m.goalValue) })

export async function GET(req: NextRequest) {
  const q = parseInt(req.nextUrl.searchParams.get("q") ?? "1")
  const y = parseInt(req.nextUrl.searchParams.get("y") ?? String(new Date().getFullYear()))
  const metrics = await prisma.healthMetric.findMany({ where: { quarter: q, year: y }, orderBy: { id: "asc" } })
  return NextResponse.json(metrics.map(ser))
}

export async function POST(req: NextRequest) {
  const { name, currentValue, goalValue, quarter, year } = await req.json()
  const metric = await prisma.healthMetric.create({ data: { name, currentValue, goalValue, quarter, year } })
  return NextResponse.json(ser(metric))
}
