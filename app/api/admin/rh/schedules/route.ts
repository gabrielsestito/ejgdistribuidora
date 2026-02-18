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
    const { employeeId, dayOfWeek, startTime, endTime, breakStart, breakEnd, notes } = body

    if (!employeeId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar se já existe horário para este dia
    const existing = await prisma.employeeSchedule.findFirst({
      where: {
        employeeId,
        dayOfWeek,
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Já existe um horário para este dia' }, { status: 400 })
    }

    const schedule = await prisma.employeeSchedule.create({
      data: {
        employeeId,
        dayOfWeek,
        startTime,
        endTime,
        breakStart: breakStart || null,
        breakEnd: breakEnd || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
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

    const schedules = await prisma.employeeSchedule.findMany({
      where: employeeId ? { employeeId } : undefined,
      orderBy: { dayOfWeek: 'asc' },
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

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}
