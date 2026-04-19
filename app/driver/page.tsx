import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DriverLayout } from '@/components/driver/driver-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  TrendingUp, 
  MapPin, 
  Calendar,
  ArrowRight,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export default async function DriverDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'DRIVER') {
    redirect('/conta/login')
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    pending,
    inProgress,
    completed,
    completedToday,
    completedThisWeek,
    completedThisMonth,
    recentDeliveries,
    nextDeliveries,
  ] = await Promise.all([
    prisma.deliveryAssignment.count({
      where: {
        driverId: session.user.id,
        status: 'PENDENTE',
      },
    }),
    prisma.deliveryAssignment.count({
      where: {
        driverId: session.user.id,
        status: 'EM_ROTA',
      },
    }),
    prisma.deliveryAssignment.count({
      where: {
        driverId: session.user.id,
        status: 'ENTREGUE',
      },
    }),
    prisma.deliveryAssignment.count({
      where: {
        driverId: session.user.id,
        status: 'ENTREGUE',
        deliveredAt: { gte: startOfToday },
      },
    }),
    prisma.deliveryAssignment.count({
      where: {
        driverId: session.user.id,
        status: 'ENTREGUE',
        deliveredAt: { gte: startOfWeek },
      },
    }),
    prisma.deliveryAssignment.count({
      where: {
        driverId: session.user.id,
        status: 'ENTREGUE',
        deliveredAt: { gte: startOfMonth },
      },
    }),
    prisma.deliveryAssignment.findMany({
      where: {
        driverId: session.user.id,
        status: 'ENTREGUE',
      },
      take: 5,
      orderBy: { deliveredAt: 'desc' },
      include: {
        order: {
          include: {
            user: true,
            address: true,
          },
        },
      },
    }),
    prisma.deliveryAssignment.findMany({
      where: {
        driverId: session.user.id,
        status: { in: ['PENDENTE', 'EM_ROTA'] },
      },
      take: 3,
      orderBy: { createdAt: 'asc' },
      include: {
        order: {
          include: {
            user: true,
            address: true,
          },
        },
      },
    }),
  ])

  const totalDeliveries = pending + inProgress + completed
  const completionRate = totalDeliveries > 0 ? (completed / totalDeliveries) * 100 : 0

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Bem-vindo, {session.user.name}!</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/driver/entregas">
                Ver Todas as Entregas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/driver/scanner">
                <Package className="mr-2 h-4 w-4" />
                Escanear QR Code
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{pending}</div>
              <p className="text-xs text-gray-500 mt-1">Aguardando início</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Em Rota</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{inProgress}</div>
              <p className="text-xs text-gray-500 mt-1">Em andamento</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Entregues</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{completed}</div>
              <p className="text-xs text-gray-500 mt-1">Total concluídas</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conclusão</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{completionRate.toFixed(0)}%</div>
              <p className="text-xs text-gray-500 mt-1">Eficiência geral</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{completedToday}</div>
              <p className="text-sm text-gray-600 mt-1">entregas realizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{completedThisWeek}</div>
              <p className="text-sm text-gray-600 mt-1">entregas realizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{completedThisMonth}</div>
              <p className="text-sm text-gray-600 mt-1">entregas realizadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximas Entregas */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Próximas Entregas
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/driver/entregas">Ver todas</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {nextDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma entrega pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nextDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {delivery.order.code}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                delivery.status === 'EM_ROTA'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {delivery.status === 'EM_ROTA' ? 'Em Rota' : 'Pendente'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {delivery.order.user.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {delivery.order.address.street}, {delivery.order.address.number}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <span>
                              {delivery.order.address.neighborhood} - {delivery.order.address.city}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(Number(delivery.order.total))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entregas Recentes */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Entregas Recentes
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/driver/entregas?status=completed">Ver histórico</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {recentDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma entrega concluída ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {delivery.order.code}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Entregue
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {delivery.order.user.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {delivery.order.address.neighborhood} - {delivery.order.address.city}
                            </span>
                          </div>
                          {delivery.deliveredAt && (
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(delivery.deliveredAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(Number(delivery.order.total))}
                          </p>
                          {delivery.recipientName && (
                            <p className="text-xs text-gray-500 mt-1">
                              Recebido por: {delivery.recipientName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DriverLayout>
  )
}
