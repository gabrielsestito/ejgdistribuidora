import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')

    const order = await prisma.order.findUnique({
      where: { code: params.code },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
        deliveryAssignments: {
          include: {
            driver: true,
          },
          orderBy: { createdAt: 'desc' },
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
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Verify access if email/phone provided
    if (email || phone) {
      const userMatch =
        order.user.email === email ||
        (phone && order.user.phone === phone)

      if (!userMatch) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }
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
