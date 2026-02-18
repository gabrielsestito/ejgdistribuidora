import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProductTable } from '@/components/admin/product-table'

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      active: true,
      featured: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  const productsForTable = products.map((product) => ({
    ...product,
    price: Number(product.price),
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-600 mt-1">Gerencie todos os produtos do catálogo</p>
          </div>
          <Button asChild>
            <Link href="/admin/produtos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Link>
          </Button>
        </div>

        <ProductTable products={productsForTable} />
      </div>
    </AdminLayout>
  )
}
