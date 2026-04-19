import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { driverId } = body

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID é obrigatório' }, { status: 400 })
    }

    // Verificar se o pedido existe
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Verificar se o entregador existe e é ativo
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
    })

    if (!driver || driver.role !== 'DRIVER' || !driver.active) {
      return NextResponse.json({ error: 'Entregador inválido' }, { status: 400 })
    }

    // Verificar se já existe atribuição
    const existing = await prisma.deliveryAssignment.findFirst({
      where: { orderId: order.id },
    })

    if (existing) {
      // Atualizar atribuição existente
      await prisma.deliveryAssignment.update({
        where: { id: existing.id },
        data: {
          driverId,
          status: 'PENDENTE',
        },
      })
    } else {
      // Criar nova atribuição
      await prisma.deliveryAssignment.create({
        data: {
          orderId: order.id,
          driverId,
          status: 'PENDENTE',
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Entrega atribuída com sucesso' })
  } catch (error) {
    console.error('Error assigning delivery:', error)
    return NextResponse.json(
      { error: 'Erro ao atribuir entrega' },
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

    // Verificar se o pedido existe
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        deliveryAssignments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (!order.deliveryAssignments || order.deliveryAssignments.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma atribuição para remover' })
    }

    // Remover todas as atribuições relacionadas ao pedido
    await prisma.deliveryAssignment.deleteMany({
      where: { orderId: order.id },
    })

    return NextResponse.json({ success: true, message: 'Entrega desatribuída com sucesso' })
  } catch (error) {
    console.error('Error unassigning delivery:', error)
    return NextResponse.json(
      { error: 'Erro ao desatribuir entrega' },
      { status: 500 }
    )
  }
}
