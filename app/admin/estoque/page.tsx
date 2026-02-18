import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { StockTable } from '@/components/admin/stock-table'

export default async function AdminStockPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stock: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-600 mt-1">Gerencie o estoque de produtos e visualize movimentações</p>
        </div>

        <StockTable products={products} />
      </div>
    </AdminLayout>
  )
}
