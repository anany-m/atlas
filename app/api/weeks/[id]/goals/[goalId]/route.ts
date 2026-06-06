import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params
  const body = await req.json()
  const goal = await prisma.weekGoal.update({ where: { id: parseInt(goalId) }, data: body })
  return NextResponse.json(goal)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params
  await prisma.weekGoal.delete({ where: { id: parseInt(goalId) } })
  return NextResponse.json({ ok: true })
}
