export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const menuOnly = searchParams.get('menu') === 'true'

    const where: any = { active: true }
    if (menuOnly) {
      where.showInMenu = true
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { active: true },
            },
          },
        },
      },
    })

    const categoryIds = categories.map((c) => c.id)
    const subcats = await (prisma as any).subcategory.findMany({
      where: {
        active: true,
        categoryId: { in: categoryIds },
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        order: true,
        categoryId: true,
      },
    })

    const withSubs = categories.map((c) => ({
      ...c,
      subcategories: subcats
        .filter((s: any) => s.categoryId === c.id)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          iconUrl: s.iconUrl,
          order: s.order,
        })),
    }))

    return NextResponse.json(withSubs, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
