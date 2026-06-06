import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.company    !== undefined) data.company    = body.company
  if (body.role       !== undefined) data.role       = body.role
  if (body.stage      !== undefined) data.stage      = body.stage
  if (body.nextAction !== undefined) data.nextAction = body.nextAction
  if (body.link       !== undefined) data.link       = body.link
  const job = await prisma.job.update({ where: { id: parseInt(id) }, data })
  return NextResponse.json(job)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.job.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
