import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const links = await prisma.navLink.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(links)
  } catch (error) {
    console.error('Error fetching nav links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const { label, link, iconUrl, order, active } = body
    if (!label || !link) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const created = await prisma.navLink.create({
      data: {
        label,
        link,
        iconUrl: iconUrl || null,
        order: order ?? 0,
        active: active ?? true,
      },
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating nav link:', error)
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}
