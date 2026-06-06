import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.title    !== undefined) data.title    = body.title
  if (body.category !== undefined) data.category = body.category
  if (body.progress !== undefined) data.progress = body.progress
  if (body.achieved !== undefined) data.achieved = body.achieved
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl
  const item = await prisma.bucketItem.update({ where: { id: parseInt(id) }, data })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.bucketItem.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
