import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const items = await prisma.bucketItem.findMany({ orderBy: { id: "asc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const { title, category } = await req.json()
  const item = await prisma.bucketItem.create({ data: { title, category } })
  return NextResponse.json(item)
}
