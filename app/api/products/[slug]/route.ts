export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await (prisma as any).product.findUnique({
      where: { slug: params.slug },
      include: {
        variants: {
          where: { active: true }
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
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

      return NextResponse.json(
        { ...product, kitItems },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    return NextResponse.json(product, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
