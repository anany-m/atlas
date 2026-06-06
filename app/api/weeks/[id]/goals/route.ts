import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { text } = await req.json()
  const goal = await prisma.weekGoal.create({
    data: { text, weekId: parseInt(id) },
  })
  return NextResponse.json(goal)
}
