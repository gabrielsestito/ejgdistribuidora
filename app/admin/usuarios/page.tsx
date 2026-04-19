import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { UsersTable } from '@/components/admin/users-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          orders: true,
          deliveryAssignments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-600 mt-1">Gerencie todos os usuários do sistema</p>
          </div>
          <Button asChild>
            <Link href="/admin/usuarios/novo">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Link>
          </Button>
        </div>

        <UsersTable users={users} />
      </div>
    </AdminLayout>
  )
}
