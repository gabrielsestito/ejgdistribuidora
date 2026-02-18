import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notice = await prisma.employeeNotice.update({
      where: { id: params.id },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Error marking notice as read:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar aviso como lido' },
      { status: 500 }
    )
  }
}
