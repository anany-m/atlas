import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toNum(v: unknown): number { return parseFloat(String(v)) || 0 }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const m = await prisma.healthMetric.update({ where: { id: parseInt(id) }, data: body })
  return NextResponse.json({ ...m, currentValue: toNum(m.currentValue), goalValue: toNum(m.goalValue) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.healthMetric.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
