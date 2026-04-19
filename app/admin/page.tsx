import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { formatPrice } from '@/lib/utils'
import { Package, ShoppingCart, TrendingUp, Truck, Wallet } from 'lucide-react'
import { BackupButton } from '@/components/admin/backup-button'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get stats
  const [
    totalProducts,
    totalOrders,
    ordersToday,
    revenueThisMonth,
    revenueTotal,
    inRouteDeliveries,
    pendingOrders,
    confirmedOrders,
    inRouteOrders,
    deliveredOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: { not: 'CANCELADO' },
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELADO' } },
      _sum: { total: true },
    }),
    prisma.deliveryAssignment.count({
      where: { status: 'EM_ROTA' },
    }),
    prisma.order.count({ where: { status: 'RECEBIDO' } }),
    prisma.order.count({ where: { status: 'SEPARANDO' } }),
    prisma.order.count({ where: { status: 'SAIU_PARA_ENTREGA' } }),
    prisma.order.count({ where: { status: 'ENTREGUE' } }),
  ])
  const monthRevenueValue = Number(revenueThisMonth._sum.total || 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Visão geral do sistema</p>
          </div>
          <BackupButton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-blue-500 text-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Total de Pedidos</p>
                <p className="text-3xl font-bold mt-2">{totalOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-500 text-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Pedidos Hoje</p>
                <p className="text-3xl font-bold mt-2">{ordersToday}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-purple-500 text-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Receita do Mês</p>
                <p className="text-2xl font-bold mt-2">{formatPrice(monthRevenueValue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-orange-500 text-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Em Rota</p>
                <p className="text-3xl font-bold mt-2">{inRouteDeliveries}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-indigo-500 text-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Produtos</p>
                <p className="text-3xl font-bold mt-2">{totalProducts}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-green-600 text-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Saldo do Mês</p>
                <p className="text-2xl font-bold mt-2">{formatPrice(monthRevenueValue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-700">Pendentes</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{pendingOrders}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-700">Confirmados</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{confirmedOrders}</p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-semibold text-orange-700">Em Rota</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{inRouteOrders}</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-700">Entregues</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{deliveredOrders}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
