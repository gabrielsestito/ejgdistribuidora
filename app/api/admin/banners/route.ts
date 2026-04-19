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

    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, subtitle, description, image, link, bgColor, textColor, order, active, isMain } = body

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle,
        description,
        image,
        link,
        bgColor: bgColor || 'bg-primary',
        textColor: textColor || 'text-white',
        order: order || 0,
        active: active !== undefined ? active : true,
        isMain: isMain !== undefined ? isMain : false,
      },
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}
