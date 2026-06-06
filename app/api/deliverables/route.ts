import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const items = await prisma.deliverable.findMany({ orderBy: { id: "asc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  const item = await prisma.deliverable.create({ data: { name } })
  return NextResponse.json(item)
}
