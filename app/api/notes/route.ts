import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const notes = await prisma.note.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  const note = await prisma.note.create({ data: { text } })
  return NextResponse.json(note)
}
