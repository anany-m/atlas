import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: "asc" } })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const { company, role, stage, nextAction, link } = await req.json()
  const job = await prisma.job.create({
    data: { company, role, stage, nextAction: nextAction || null, link: link || null },
  })
  return NextResponse.json(job)
}
