import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toNum(v: unknown): number { return parseFloat(String(v)) || 0 }

export async function GET(req: NextRequest) {
  const q = parseInt(req.nextUrl.searchParams.get("q") ?? "1")
  const y = parseInt(req.nextUrl.searchParams.get("y") ?? String(new Date().getFullYear()))
  const entries = await prisma.savingsEntry.findMany({ where: { quarter: q, year: y }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(entries.map(e => ({ ...e, amount: toNum(e.amount) })))
}

export async function POST(req: NextRequest) {
  const { label, amount, type, quarter, year } = await req.json()
  const entry = await prisma.savingsEntry.create({ data: { label, amount, type, quarter, year } })
  return NextResponse.json({ ...entry, amount: toNum(entry.amount) })
}
