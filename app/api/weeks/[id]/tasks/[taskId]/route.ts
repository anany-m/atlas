import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const body = await req.json()
  const task = await prisma.task.update({ where: { id: parseInt(taskId) }, data: body })
  return NextResponse.json(task)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  await prisma.task.delete({ where: { id: parseInt(taskId) } })
  return NextResponse.json({ ok: true })
}
