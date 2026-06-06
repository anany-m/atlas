import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const goal = await prisma.quarterGoal.update({ where: { id: parseInt(id) }, data: body })
  return NextResponse.json(goal)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.quarterGoal.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
