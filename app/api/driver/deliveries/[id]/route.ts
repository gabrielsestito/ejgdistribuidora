import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusEmail } from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status, recipientName, notes } = body

    const delivery = await prisma.deliveryAssignment.findUnique({
      where: { id: params.id },
      include: {
        order: true,
      },
    })

    if (!delivery || delivery.driverId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.deliveryAssignment.update({
      where: { id: params.id },
      data: {
        status,
        recipientName,
        notes,
        deliveredAt: status === 'ENTREGUE' ? new Date() : undefined,
      },
    })

    // Sincronizar status do pedido com o status da entrega
    let orderStatus = delivery.order.status
    if (status === 'EM_ROTA') {
      orderStatus = 'SAIU_PARA_ENTREGA'
    } else if (status === 'ENTREGUE') {
      orderStatus = 'ENTREGUE'
    }

    // Atualizar status do pedido
    const updatedOrder = await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: orderStatus,
        statusLogs: {
          create: {
            status: orderStatus,
            notes:
              status === 'ENTREGUE'
                ? `Entregue por ${session.user.name}. Recebido por: ${recipientName}`
                : status === 'EM_ROTA'
                ? `Em rota com ${session.user.name}`
                : `Status atualizado: ${status}`,
          },
        },
      },
      include: {
        user: true,
      },
    })

    if (updatedOrder.user?.email) {
      await sendOrderStatusEmail({
        to: updatedOrder.user.email,
        name: updatedOrder.user.name,
        code: updatedOrder.code,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating delivery:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar entrega' },
      { status: 500 }
    )
  }
}
