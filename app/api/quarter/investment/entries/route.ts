import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toNum(v: unknown): number { return parseFloat(String(v)) || 0 }

export async function POST(req: NextRequest) {
  const { investmentId, name, amount } = await req.json()
  const entry = await prisma.investmentEntry.create({ data: { investmentId, name, amount } })
  return NextResponse.json({ ...entry, amount: toNum(entry.amount) })
}
