import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = parseInt(req.nextUrl.searchParams.get("q") ?? "1")
  const y = parseInt(req.nextUrl.searchParams.get("y") ?? String(new Date().getFullYear()))
  const items = await prisma.parkingLot.findMany({ where: { quarter: q, year: y }, orderBy: { id: "asc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const { text, category, link, quarter, year } = await req.json()
  const item = await prisma.parkingLot.create({ data: { text, category, link: link || null, quarter, year } })
  return NextResponse.json(item)
}
