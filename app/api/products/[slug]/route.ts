import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    if (product.productType === 'KIT') {
      const kitItems = await prisma.kitItem.findMany({
        where: { kitId: product.id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              brand: true,
              weight: true,
              weightUnit: true,
            },
          },
        },
      })

      return NextResponse.json({ ...product, kitItems })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}
