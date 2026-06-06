import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.event.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.title)     data.title    = body.title
  if (body.category)  data.category = body.category
  if (body.startTime) data.startTime = new Date(`1970-01-01T${body.startTime}:00.000Z`)
  if (body.endTime)   data.endTime   = new Date(`1970-01-01T${body.endTime}:00.000Z`)

  const event = await prisma.event.update({ where: { id: parseInt(id) }, data })
  return NextResponse.json(event)
}
