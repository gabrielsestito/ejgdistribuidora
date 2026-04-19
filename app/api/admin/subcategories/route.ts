import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subcategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().optional(),
  iconUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId') || undefined

    const list = await (prisma as any).subcategory.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return NextResponse.json({ error: 'Erro ao buscar subcategorias' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = subcategorySchema.parse(body)

    let baseSlug = data.slug || data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    let slug = baseSlug
    let counter = 1
    while (await (prisma as any).subcategory.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const created = await (prisma as any).subcategory.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        slug,
        iconUrl: data.iconUrl || null,
        order: data.order,
        active: data.active,
      },
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating subcategory:', error)
    return NextResponse.json({ error: 'Erro ao criar subcategoria' }, { status: 500 })
  }
}
