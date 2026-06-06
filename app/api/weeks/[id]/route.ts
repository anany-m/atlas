import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const week = await prisma.week.update({
    where: { id: parseInt(id) },
    data: { weeklyFocus: body.weeklyFocus },
  })
  return NextResponse.json(week)
}
