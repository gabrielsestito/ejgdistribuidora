import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/admin/product-form'
import { parseImages } from '@/lib/utils'

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { 
      category: true,
    },
  })

  if (!product) {
    notFound()
  }

  const images = parseImages(product.images)
  const kitItems = await prisma.kitItem.findMany({
    where: { kitId: product.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const productForForm = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: (product as any).sku || null,
    description: product.description,
    detailedDescription: product.detailedDescription,
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    price: product.price ? Number(product.price) : null,
    stock: product.stock,
    weight: product.weight ? Number(product.weight) : null,
    weightUnit: product.weightUnit,
    brand: product.brand,
    productType: product.productType,
    active: product.active,
    featured: product.featured || false,
    categoryId: product.categoryId,
    images,
    expirationDate: product.expirationDate ? product.expirationDate.toISOString() : null,
    wholesalePackSize: product.wholesalePackSize ?? null,
    wholesalePackPrice: product.wholesalePackPrice ? Number(product.wholesalePackPrice) : null,
    sellingMode: (product as any).sellingMode || 'UNIT',
    kitItems: kitItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      brand: item.brand,
      notes: item.notes,
    })) || [],
  }

  return <ProductForm product={productForForm} />
}
