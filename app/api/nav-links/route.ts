import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const model: any = (prisma as any).navLink
    if (!model?.findMany) {
      return NextResponse.json([])
    }
    const links = await model.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        label: true,
        link: true,
        iconUrl: true,
        order: true,
      },
    })
    return NextResponse.json(links)
  } catch (error) {
    console.error('Error fetching nav links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}
