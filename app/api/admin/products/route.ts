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
  subcategoryId: z.string().nullable().optional(),
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
  variants: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().trim().optional().nullable(),
    price: z.preprocess((val) => val === '' || val === null || val === undefined ? null : Number(val), z.number().nullable().optional()),
    stock: z.preprocess((val) => val === '' || val === null || val === undefined ? 0 : Number(val), z.number().int().min(0)),
    images: z.array(z.string()).optional(),
    active: z.boolean().default(true),
  })).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await (prisma as any).product.findMany({
      include: {
        category: true,
        subcategory: true,
        variants: true,
        kitItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
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
    console.log('API POST - Body received:', JSON.stringify(body, null, 2))
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
    while (await (prisma as any).product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Gerar SKU se não informado
    let sku =
      data.sku
        ? data.sku.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').replace(/--+/g, '-')
        : `SKU-${baseSlug.replace(/-/g, '').toUpperCase().slice(0, 12)}`
    let skuCounter = 1
    while (await (prisma as any).product.findUnique({ where: { sku } })) {
      sku = `${sku}-${skuCounter}`
      skuCounter++
    }

    // Criar produto
    console.log('Creating product with variants:', JSON.stringify(data.variants, null, 2))
    const product = await (prisma as any).product.create({
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
        ...(data.subcategoryId
          ? { subcategory: { connect: { id: data.subcategoryId } } }
          : {}),
        active: data.active,
        featured: data.featured || false,
        slug,
        images: data.images ? JSON.parse(data.images) : null,
        expirationDate: data.expirationDate ?? null,
        wholesalePackSize: data.wholesalePackSize ?? null,
        wholesalePackPrice: data.wholesalePackPrice ?? null,
        sellingMode: data.sellingMode || 'UNIT',
        variants: data.variants && Array.isArray(data.variants) && data.variants.length > 0 ? {
          create: data.variants.map((v: any) => ({
            name: v.name,
            sku: v.sku || undefined,
            price: v.price ?? null,
            stock: v.stock ?? 0,
            images: v.images || [],
            active: v.active ?? true,
          }))
        } : undefined
      },
    })
    console.log('Product created successfully, id:', product.id)

    // Se for KIT, criar itens do kit
    if (data.productType === 'KIT' && data.kitItems && data.kitItems.length > 0) {
      await (prisma as any).kitItem.createMany({
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
