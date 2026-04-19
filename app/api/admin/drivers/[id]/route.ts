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
    const driver = await prisma.user.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(driver)
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar entregador' },
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

    const driver = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        role: true,
        _count: {
          select: {
            deliveryAssignments: true,
          },
        },
      },
    })

    if (!driver) {
      return NextResponse.json({ error: 'Entregador não encontrado' }, { status: 404 })
    }

    if (driver.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Usuário não é entregador' }, { status: 400 })
    }

    if (driver._count.deliveryAssignments > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir entregador com entregas vinculadas' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting driver:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir entregador' },
      { status: 500 }
    )
  }
}
