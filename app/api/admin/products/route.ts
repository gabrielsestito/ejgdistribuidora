import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  originalPrice: z.number().nullable().optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  weight: z.number().nullable().optional(),
  weightUnit: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  productType: z.string().default('NORMAL'),
  categoryId: z.string(),
  active: z.boolean(),
  featured: z.boolean().optional(),
  images: z.string().optional(),
  slug: z.string().optional(),
  expirationDate: z.preprocess((val) => {
    if (val === null || val === undefined) return null
    if (typeof val === 'string') {
      const s = val.trim()
      if (!s) return null
      const d = new Date(s)
      return isNaN(d.getTime()) ? null : d
    }
    if (val instanceof Date) return val
    return null
  }, z.date().nullable().optional()),
  wholesalePackSize: z.number().int().min(1).nullable().optional(),
  wholesalePackPrice: z.number().min(0).nullable().optional(),
  sellingMode: z.enum(['UNIT', 'PACK', 'BOTH']).default('UNIT'),
  kitItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    unit: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        kitItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    // Gerar slug a partir do nome
    let baseSlug = data.slug || data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Garantir que o slug seja único
    let slug = baseSlug
    let counter = 1
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Gerar SKU se não informado
    let sku =
      data.sku
        ? data.sku.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').replace(/--+/g, '-')
        : `SKU-${baseSlug.replace(/-/g, '').toUpperCase().slice(0, 12)}`
    let skuCounter = 1
    while (await prisma.product.findUnique({ where: { sku } })) {
      sku = `${sku}-${skuCounter}`
      skuCounter++
    }

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku,
        description: data.description,
        originalPrice: data.originalPrice,
        price: data.price,
        stock: data.stock,
        weight: data.weight,
        weightUnit: data.weightUnit || 'kg',
        brand: data.brand,
        productType: data.productType,
        category: { connect: { id: data.categoryId } },
        active: data.active,
        featured: data.featured || false,
        slug,
        images: data.images ? JSON.parse(data.images) : null,
        expirationDate: data.expirationDate ?? null,
        wholesalePackSize: data.wholesalePackSize ?? null,
        wholesalePackPrice: data.wholesalePackPrice ?? null,
        sellingMode: data.sellingMode || 'UNIT',
      },
    })

    // Se for KIT, criar itens do kit
    if (data.productType === 'KIT' && data.kitItems && data.kitItems.length > 0) {
      await prisma.kitItem.createMany({
        data: data.kitItems.map((item) => ({
          kitId: product.id,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          brand: item.brand,
          notes: item.notes,
        })),
      })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}
