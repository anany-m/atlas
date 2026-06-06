import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ choreId: string }> }) {
  const { choreId } = await params
  const body = await req.json()
  const chore = await prisma.chore.update({ where: { id: parseInt(choreId) }, data: body })
  return NextResponse.json(chore)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ choreId: string }> }) {
  const { choreId } = await params
  await prisma.chore.delete({ where: { id: parseInt(choreId) } })
  return NextResponse.json({ ok: true })
}
