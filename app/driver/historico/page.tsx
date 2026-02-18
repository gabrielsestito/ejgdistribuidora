import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DriverLayout } from '@/components/driver/driver-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { CheckCircle, MapPin, Calendar, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default async function DriverHistoryPage({
  searchParams,
}: {
  searchParams: { search?: string; date?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'DRIVER') {
    redirect('/conta/login')
  }

  const where: any = {
    driverId: session.user.id,
    status: 'ENTREGUE',
  }

  if (searchParams.search) {
    where.OR = [
      { order: { code: { contains: searchParams.search, mode: 'insensitive' } } },
      { order: { user: { name: { contains: searchParams.search, mode: 'insensitive' } } } },
    ]
  }

  if (searchParams.date) {
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
        },
      },
    },
    orderBy: { deliveredAt: 'desc' },
    take: 50,
  })

  const totalDeliveries = await prisma.deliveryAssignment.count({
    where: {
      driverId: session.user.id,
      status: 'ENTREGUE',
    },
  })

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Histórico de Entregas</h1>
            <p className="text-gray-600 mt-1">
              {totalDeliveries} {totalDeliveries === 1 ? 'entrega concluída' : 'entregas concluídas'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form method="get" className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="search"
                    placeholder="Buscar por código do pedido ou cliente..."
                    defaultValue={searchParams.search}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Input
                  name="date"
                  type="date"
                  defaultValue={searchParams.date}
                  className="w-full"
                />
              </div>
              <Button type="submit" variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              {(searchParams.search || searchParams.date) && (
                <Button type="button" variant="ghost" asChild>
                  <Link href="/driver/historico">Limpar</Link>
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Deliveries List */}
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 text-lg mb-2">Nenhuma entrega encontrada</p>
              <p className="text-gray-500 text-sm">
                {searchParams.search || searchParams.date
                  ? 'Tente ajustar os filtros de busca'
                  : 'Você ainda não concluiu nenhuma entrega'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {delivery.order.code}
                          </h3>
                          <p className="text-sm text-gray-600">{delivery.order.user.name}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Entregue
                        </span>
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:pl-16">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Endereço</p>
                            <p className="text-sm text-gray-600">
                              {delivery.order.address.street}, {delivery.order.address.number}
                            </p>
                            <p className="text-sm text-gray-600">
                              {delivery.order.address.neighborhood} - {delivery.order.address.city}/{delivery.order.address.state}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Data de Entrega</p>
                            <p className="text-sm text-gray-600">
                              {delivery.deliveredAt
                                ? new Date(delivery.deliveredAt).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {delivery.recipientName && (
                        <div className="md:pl-16">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Recebido por:</span> {delivery.recipientName}
                          </p>
                        </div>
                      )}

                      {delivery.notes && (
                        <div className="md:pl-16">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Observações:</span> {delivery.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="md:text-right pl-16 md:pl-0">
                      <p className="text-2xl font-bold text-primary mb-2">
                        {formatPrice(Number(delivery.order.total))}
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/acompanhar?code=${delivery.order.code}`} target="_blank">
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  )
}
