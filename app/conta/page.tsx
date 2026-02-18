import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Settings, User, ShoppingBag, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/conta/login')
  }

  // Redirecionar funcionários para o painel do funcionário
  if (session.user.role === 'EMPLOYEE') {
    redirect('/employee')
  }

  // Redirecionar entregadores para o painel do entregador
  if (session.user.role === 'DRIVER') {
    redirect('/driver')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            take: 1,
          },
        },
      },
      addresses: {
        take: 1,
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/conta/login')
  }

  const statusLabels: Record<string, string> = {
    RECEBIDO: 'Pedido confirmado',
    SEPARANDO: 'Separando',
    SAIU_PARA_ENTREGA: 'Saiu para Entrega',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
              <p className="text-gray-600">Gerencie suas informações e acompanhe seus pedidos</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Informações Pessoais */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                      <p className="text-sm text-gray-500">Seus dados de cadastro</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link href="/conta/configuracoes">
                      <Settings className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Estatísticas</CardTitle>
                      <p className="text-sm text-gray-500">Seus números</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">{user._count.orders}</p>
                    <p className="text-sm text-gray-600">Pedidos realizados</p>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/conta/pedidos">
                      Ver Todos os Pedidos
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Endereço</CardTitle>
                      <p className="text-sm text-gray-500">Endereço de entrega</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {user.addresses.length > 0 ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">
                        {user.addresses[0].street}, {user.addresses[0].number}
                      </p>
                      <p className="text-gray-600">
                        {user.addresses[0].neighborhood} - {user.addresses[0].city}/{user.addresses[0].state}
                      </p>
                      <p className="text-gray-600">CEP: {user.addresses[0].zipCode}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">Nenhum endereço cadastrado</p>
                  )}
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link href="/conta/configuracoes">
                      {user.addresses.length > 0 ? 'Editar Endereço' : 'Adicionar Endereço'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Pedidos Recentes */}
            {user.orders.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Pedidos Recentes</CardTitle>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/conta/pedidos">Ver todos</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-semibold">Pedido {order.code}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                            </span>
                            <span className="font-semibold text-primary">
                              {formatPrice(Number(order.total))}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'ENTREGUE'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'CANCELADO'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
