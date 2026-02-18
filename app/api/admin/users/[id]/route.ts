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
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            orders: true,
            deliveryAssignments: true,
            employeeDocuments: true,
            employeeNotices: true,
            employeeSchedules: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const c = user._count
    if (
      c.orders > 0 ||
      c.deliveryAssignments > 0 ||
      c.employeeDocuments > 0 ||
      c.employeeNotices > 0 ||
      c.employeeSchedules > 0
    ) {
      return NextResponse.json(
        { error: 'Não é possível excluir usuário com registros relacionados' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    )
  }
}
