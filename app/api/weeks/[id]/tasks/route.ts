import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { title } = await req.json()
  const task = await prisma.task.create({
    data: { title, weekId: parseInt(id) },
  })
  return NextResponse.json(task)
}
