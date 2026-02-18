import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : []
    const limit = typeof body.limit === 'number' ? Math.max(1, Math.min(12, body.limit)) : 8

    if (productIds.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    const baseProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true },
    })

    const categoryIds = Array.from(new Set(baseProducts.map((p) => p.categoryId).filter(Boolean)))
    if (categoryIds.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    const similar = await prisma.product.findMany({
      where: {
        active: true,
        categoryId: { in: categoryIds as string[] },
        id: { notIn: productIds },
        stock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        originalPrice: true,
        images: true,
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    const payload = similar.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price ? Number(p.price as any) : 0,
      originalPrice: p.originalPrice ? Number(p.originalPrice as any) : null,
      images: Array.isArray(p.images) ? (p.images as string[]) : [],
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: 'Erro ao buscar recomendações' }, { status: 500 })
  }
}
