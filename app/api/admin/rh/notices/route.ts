import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { employeeId, title, message, isGeneral } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const notice = await prisma.employeeNotice.create({
      data: {
        employeeId: isGeneral ? null : employeeId,
        title,
        message,
        isGeneral: isGeneral || false,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Error creating notice:', error)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const isGeneral = searchParams.get('isGeneral')

    const notices = await prisma.employeeNotice.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(isGeneral === 'true' ? { isGeneral: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('Error fetching notices:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}
