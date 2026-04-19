import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CategoriesTable } from '@/components/admin/categories-table'

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
            <p className="text-gray-600 mt-1">Organize seus produtos por categorias</p>
          </div>
          <Button asChild>
            <Link href="/admin/categorias/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Link>
          </Button>
        </div>

        <CategoriesTable categories={categories} />
      </div>
    </AdminLayout>
  )
}
