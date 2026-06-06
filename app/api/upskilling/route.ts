import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const items = await prisma.upskilling.findMany({ orderBy: { id: "asc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const { name, provider } = await req.json()
  const item = await prisma.upskilling.create({ data: { name, provider } })
  return NextResponse.json(item)
}
