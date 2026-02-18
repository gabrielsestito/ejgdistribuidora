import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar, AlertTriangle } from 'lucide-react'
import { ReportsFilters } from '@/components/admin/reports-filters'
import Link from 'next/link'

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { startDate?: string; endDate?: string; status?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const { startDate, endDate, status } = searchParams

  // Construir filtros
  const where: any = {}
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(startDate)
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate + 'T23:59:59')
    }
  }
  if (status && status !== 'all') {
    where.status = status
  }

  // Buscar dados
  const [
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    ordersByStatus,
    recentOrders,
    revenueByMonth,
    topProducts,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, status: { not: 'CANCELADO' } },
      _sum: { total: true },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { active: true } }),
    prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    }),
    prisma.order.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: { take: 1 },
      },
    }),
    // Revenue por mês (últimos 6 meses)
    prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        SUM(total) as revenue
      FROM orders
      WHERE status != 'CANCELADO'
        AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month DESC
    ` as any,
    // Produtos mais vendidos
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          ...where,
          status: { not: 'CANCELADO' },
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    }),
    // Produtos com estoque baixo
    prisma.product.findMany({
      where: {
        active: true,
        stock: { lte: 10 },
      },
      orderBy: { stock: 'asc' },
      take: 10,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
  ])

  // Buscar nomes dos produtos mais vendidos
  const topProductsWithNames = await Promise.all(
    topProducts.map(async (item) => {
      if (!item.productId) return null
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true },
      })
      return {
        ...item,
        productName: product?.name || 'Produto não encontrado',
      }
    })
  )

  const statusLabels: Record<string, string> = {
    RECEBIDO: 'Pedido confirmado',
    SEPARANDO: 'Separando',
    SAIU_PARA_ENTREGA: 'Saiu para Entrega',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise completa do seu negócio</p>
        </div>

        <ReportsFilters />

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Pedidos</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalOrders}</div>
              <p className="text-xs text-gray-500 mt-1">
                {startDate || endDate ? 'No período selecionado' : 'Todos os tempos'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatPrice(Number(totalRevenue._sum.total || 0))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pedidos não cancelados
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Clientes</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalCustomers}</div>
              <p className="text-xs text-gray-500 mt-1">
                Clientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Produtos Ativos</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalProducts}</div>
              <p className="text-xs text-gray-500 mt-1">
                No catálogo
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pedidos por Status */}
          <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold">Pedidos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ordersByStatus.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem dados disponíveis</p>
                ) : (
                  ordersByStatus.map((item) => (
                    <div key={item.status} className="flex justify-between items-center">
                      <span className="text-sm">{statusLabels[item.status] || item.status}</span>
                      <span className="font-semibold">{item._count.id}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receita por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Mês (Últimos 6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(revenueByMonth) && revenueByMonth.length > 0 ? (
                  revenueByMonth.map((item: any) => (
                    <div key={item.month} className="flex justify-between items-center">
                      <span className="text-sm">
                        {new Date(item.month + '-01').toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-semibold">
                        {formatPrice(Number(item.revenue))}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Sem dados disponíveis</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Produtos Mais Vendidos */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {topProductsWithNames.filter(Boolean).length === 0 ? (
                <p className="text-sm text-gray-500">Sem dados disponíveis</p>
              ) : (
                <div className="space-y-3">
                  {topProductsWithNames
                    .filter(Boolean)
                    .map((item: any, index) => (
                      <div key={item.productId} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-400 w-6">
                            #{index + 1}
                          </span>
                          <span className="text-sm">{item.productName}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-sm">
                            {Number(item._sum.quantity || 0)} unidades
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estoque Baixo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum produto com estoque baixo</p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-2 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category.name}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            product.stock === 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {product.stock} unidades
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link href="/admin/estoque">Ver Todos</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pedidos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500">Nenhum pedido encontrado.</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">
                        <Link href={`/admin/pedidos/${order.id}`} className="text-primary hover:underline">
                          Pedido {order.code}
                        </Link>
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.user.name} - {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatPrice(Number(order.total))}
                      </p>
                      <p className="text-sm text-gray-600">{statusLabels[order.status]}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
