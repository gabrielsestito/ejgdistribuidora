import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseQRCodeData } from '@/lib/qrcode'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, orderCode } = body

    if (!orderId || !orderCode) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Verificar se o pedido existe e tem o QR Code correto
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order || order.code !== orderCode) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Verificar se já existe atribuição
    const existing = await prisma.deliveryAssignment.findFirst({
      where: { orderId: order.id },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Pedido já atribuído a outro entregador' },
        { status: 400 }
      )
    }

    // Criar atribuição
    const assignment = await prisma.deliveryAssignment.create({
      data: {
        orderId: order.id,
        driverId: session.user.id,
        status: 'PENDENTE',
      },
      include: {
        order: {
          include: {
            user: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      assignment,
      message: 'Entrega atribuída com sucesso',
    })
  } catch (error) {
    console.error('Error assigning delivery:', error)
    return NextResponse.json(
      { error: 'Erro ao atribuir entrega' },
      { status: 500 }
    )
  }
}
