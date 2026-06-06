import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toNum(v: unknown): number { return parseFloat(String(v)) || 0 }

function serializeInvestment(inv: {
  id: number; goalAmount: unknown; quarter: number; year: number
  entries: { id: number; name: string; amount: unknown; investmentId: number }[]
}) {
  return {
    id:         inv.id,
    goalAmount: toNum(inv.goalAmount),
    quarter:    inv.quarter,
    year:       inv.year,
    entries:    inv.entries.map(e => ({ id: e.id, name: e.name, amount: toNum(e.amount), investmentId: e.investmentId })),
  }
}

export async function GET(req: NextRequest) {
  const q = parseInt(req.nextUrl.searchParams.get("q") ?? "1")
  const y = parseInt(req.nextUrl.searchParams.get("y") ?? String(new Date().getFullYear()))
  const inv = await prisma.investment.upsert({
    where:   { quarter_year: { quarter: q, year: y } },
    create:  { quarter: q, year: y, goalAmount: 0 },
    update:  {},
    include: { entries: true },
  })
  return NextResponse.json(serializeInvestment(inv))
}

export async function PUT(req: NextRequest) {
  const q = parseInt(req.nextUrl.searchParams.get("q") ?? "1")
  const y = parseInt(req.nextUrl.searchParams.get("y") ?? String(new Date().getFullYear()))
  const { goalAmount } = await req.json()
  const inv = await prisma.investment.upsert({
    where:  { quarter_year: { quarter: q, year: y } },
    create: { quarter: q, year: y, goalAmount },
    update: { goalAmount },
  })
  return NextResponse.json({ ...inv, goalAmount: toNum(inv.goalAmount) })
}
