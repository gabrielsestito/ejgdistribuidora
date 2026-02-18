import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusEmail } from '@/lib/email'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
        deliveryAssignments: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    // Buscar kitItems para produtos tipo KIT
    if (order) {
      const kitProductIds = order.items
        .filter((item: any) => item.product?.productType === 'KIT')
        .map((item: any) => item.productId)

      if (kitProductIds.length > 0) {
        const kitItems = await prisma.kitItem.findMany({
          where: {
            kitId: { in: kitProductIds },
          },
          include: {
            product: true,
          },
        })

        // Adicionar kitItems aos produtos correspondentes
        order.items = order.items.map((item: any) => {
          if (item.product?.productType === 'KIT') {
            return {
              ...item,
              product: {
                ...item.product,
                kitItems: kitItems.filter((ki) => ki.kitId === item.productId),
              },
            }
          }
          return item
        })
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

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
    const { notes, status, paymentMethod, paymentStatus } = body

    // Preparar dados de atualização
    const updateData: any = {}
    if (notes !== undefined) {
      updateData.notes = notes || null
    }
    if (status !== undefined) {
      updateData.status = status
      // Criar log de status
      updateData.statusLogs = {
        create: {
          status: status,
          notes: `Status alterado por ${session.user.name}`,
        },
      }
    }
    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod || null
    }
    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
        deliveryAssignments: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (status !== undefined && order.user?.email) {
      await sendOrderStatusEmail({
        to: order.user.email,
        name: order.user.name,
        code: order.code,
        status: order.status,
        paymentStatus: order.paymentStatus,
      })
    }

    // Sincronizar status do deliveryAssignment se existir
    if (status !== undefined && order.deliveryAssignments.length > 0) {
      const deliveryAssignment = order.deliveryAssignments[0]
      let deliveryStatus = deliveryAssignment.status

      // Mapear status do pedido para status da entrega
      if (status === 'SAIU_PARA_ENTREGA') {
        deliveryStatus = 'EM_ROTA'
      } else if (status === 'ENTREGUE') {
        deliveryStatus = 'ENTREGUE'
      } else if (status === 'RECEBIDO' || status === 'SEPARANDO') {
        deliveryStatus = 'PENDENTE'
      }

      // Atualizar deliveryAssignment se o status mudou
      if (deliveryStatus !== deliveryAssignment.status) {
        await prisma.deliveryAssignment.update({
          where: { id: deliveryAssignment.id },
          data: {
            status: deliveryStatus,
            deliveredAt: deliveryStatus === 'ENTREGUE' ? new Date() : undefined,
          },
        })
      }
    }

    // Buscar kitItems para produtos tipo KIT
    if (order) {
      const kitProductIds = order.items
        .filter((item: any) => item.product?.productType === 'KIT')
        .map((item: any) => item.productId)

      if (kitProductIds.length > 0) {
        const kitItems = await prisma.kitItem.findMany({
          where: {
            kitId: { in: kitProductIds },
          },
          include: {
            product: true,
          },
        })

        // Adicionar kitItems aos produtos correspondentes
        order.items = order.items.map((item: any) => {
          if (item.product?.productType === 'KIT') {
            return {
              ...item,
              product: {
                ...item.product,
                kitItems: kitItems.filter((ki) => ki.kitId === item.productId),
              },
            }
          }
          return item
        })
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
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

    await prisma.order.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir pedido' },
      { status: 500 }
    )
  }
}
