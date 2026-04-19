import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DriverLayout } from '@/components/driver/driver-layout'
import { DeliveriesTable } from '@/components/driver/deliveries-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Clock, Truck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DriverDeliveriesPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; date?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'DRIVER') {
    redirect('/conta/login')
  }

  const isCompletedView = searchParams.status === 'completed'
  const statusFilter = isCompletedView ? 'ENTREGUE' : { in: ['PENDENTE', 'EM_ROTA'] }
  const where: any = {
    driverId: session.user.id,
    status: statusFilter,
  }

  if (isCompletedView && searchParams.search) {
    where.OR = [
      { order: { code: { contains: searchParams.search, mode: 'insensitive' } } },
      { order: { user: { name: { contains: searchParams.search, mode: 'insensitive' } } } },
    ]
  }

  if (isCompletedView && searchParams.date) {
    const date = new Date(searchParams.date)
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setHours(23, 59, 59, 999))
    where.deliveredAt = {
      gte: startOfDay,
      lte: endOfDay,
    }
  }

  const deliveries = await prisma.deliveryAssignment.findMany({
    where,
    include: {
      order: {
        include: {
          user: true,
          address: true,
          items: {
            include: {
              product: true,
              basket: true,
            },
          },
        },
      },
    },
    orderBy: searchParams.status === 'completed' ? { deliveredAt: 'desc' } : { createdAt: 'asc' },
  })

  const [pendingCount, inProgressCount, completedCount] = await Promise.all([
    prisma.deliveryAssignment.count({
      where: { driverId: session.user.id, status: 'PENDENTE' },
    }),
    prisma.deliveryAssignment.count({
      where: { driverId: session.user.id, status: 'EM_ROTA' },
    }),
    prisma.deliveryAssignment.count({
      where: { driverId: session.user.id, status: 'ENTREGUE' },
    }),
  ])

  const deliveriesForTable = deliveries.map((d) => ({
    ...d,
    order: {
      ...d.order,
      subtotal: d.order.subtotal != null ? Number(d.order.subtotal) : null,
      shipping: d.order.shipping != null ? Number(d.order.shipping) : null,
      total: d.order.total != null ? Number(d.order.total) : null,
      distance: (d.order as any).distance != null ? Number((d.order as any).distance) : (d.order as any).distance,
      items: d.order.items.map((i) => ({
        ...i,
        price: i.price != null ? Number(i.price) : null,
        product: i.product
          ? {
              ...i.product,
              originalPrice: i.product.originalPrice != null ? Number(i.product.originalPrice) : null,
              price: i.product.price != null ? Number(i.product.price) : null,
              weight: i.product.weight != null ? Number(i.product.weight) : null,
            }
          : i.product,
        basket: i.basket
          ? {
              ...i.basket,
              price: (i.basket as any).price != null ? Number((i.basket as any).price) : (i.basket as any).price,
            }
          : i.basket,
      })),
    },
  }))

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Minhas Entregas</h1>
            <p className="text-gray-600 mt-1">
              {isCompletedView ? 'Histórico de entregas concluídas' : 'Gerencie suas entregas pendentes e em andamento'}
            </p>
          </div>
        </div>

        <Card className="border-gray-200">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/driver/entregas"
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  !isCompletedView ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Pendentes/Em rota
              </Link>
              <Link
                href="/driver/entregas?status=completed"
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  isCompletedView ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Concluídas
              </Link>
            </div>
          </CardContent>
        </Card>

        {!isCompletedView && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Em Rota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCount}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
        </div>
        )}

        {isCompletedView && (
          <Card>
            <CardContent className="pt-6">
              <form method="get" className="flex flex-col md:flex-row gap-4">
                <input type="hidden" name="status" value="completed" />
                <div className="flex-1">
                  <Input
                    name="search"
                    placeholder="Buscar por código do pedido ou cliente..."
                    defaultValue={searchParams.search}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Input name="date" type="date" defaultValue={searchParams.date} />
                </div>
                <Button type="submit" variant="outline">
                  Filtrar
                </Button>
                {(searchParams.search || searchParams.date) && (
                  <Button type="button" variant="ghost" asChild>
                    <Link href="/driver/entregas?status=completed">Limpar</Link>
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Deliveries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveriesTable deliveries={deliveriesForTable} />
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  )
}
