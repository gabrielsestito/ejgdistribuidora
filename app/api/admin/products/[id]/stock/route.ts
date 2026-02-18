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
    const { type, quantity, reason } = body

    if (!type || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Tipo e quantidade são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar produto atual
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Calcular novo estoque
    const newStock =
      type === 'ENTRADA'
        ? product.stock + quantity
        : Math.max(0, product.stock - quantity)

    // Atualizar estoque e criar movimentação
    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id: params.id },
        data: { stock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          productId: params.id,
          type,
          quantity,
          reason: reason || 'Ajuste manual',
          createdBy: session.user.id,
        },
      }),
    ])

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: 'Erro ao ajustar estoque' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(movements)
  } catch (error) {
    console.error('Error fetching stock history:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    )
  }
}
