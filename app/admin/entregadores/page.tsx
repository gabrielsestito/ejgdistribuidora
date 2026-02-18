import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DriversTable } from '@/components/admin/drivers-table'

export default async function AdminDriversPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER' },
    include: {
      _count: {
        select: { deliveryAssignments: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Entregadores</h1>
            <p className="text-gray-600 mt-1">Gerencie sua equipe de entregadores</p>
          </div>
          <Button asChild>
            <Link href="/admin/entregadores/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Entregador
            </Link>
          </Button>
        </div>

        <DriversTable drivers={drivers} />
      </div>
    </AdminLayout>
  )
}
