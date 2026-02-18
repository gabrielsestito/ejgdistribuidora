import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { OrdersTable } from '@/components/admin/orders-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; payment?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const where: any = {}
  if (searchParams.status && searchParams.status !== 'all') {
    where.status = searchParams.status
  }
  if (searchParams.search) {
    where.OR = [
      { code: { contains: searchParams.search, mode: 'insensitive' } },
      { user: { name: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }
  if (searchParams.payment && searchParams.payment !== 'all') {
    where.paymentStatus = searchParams.payment
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      code: true,
      status: true,
      paymentStatus: true,
        paymentMethod: true,
        paymentMethodDetail: true,
      total: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
      items: {
        select: {
          quantity: true,
        },
      },
      deliveryAssignments: {
        select: {
          status: true,
          driver: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const ordersForTable = orders.map((order) => ({
    ...order,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
  }))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-gray-600 mt-1">Gerencie todos os pedidos do sistema</p>
          </div>
          <Button asChild>
            <Link href="/admin/pedidos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Pedido
            </Link>
          </Button>
        </div>

        <OrdersTable orders={ordersForTable} />
      </div>
    </AdminLayout>
  )
}
