import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MainLayout } from '@/components/layout/main-layout'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const statusLabels: Record<string, string> = {
  RECEBIDO: 'Pedido confirmado',
  SEPARANDO: 'Separando',
  SAIU_PARA_ENTREGA: 'Saiu para Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

const statusColors: Record<string, string> = {
  RECEBIDO: 'bg-blue-100 text-blue-800',
  SEPARANDO: 'bg-yellow-100 text-yellow-800',
  SAIU_PARA_ENTREGA: 'bg-purple-100 text-purple-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

const paymentMethodLabels: Record<string, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão de crédito',
  CARTAO_DEBITO: 'Cartão de débito',
  DINHEIRO: 'Dinheiro',
  BOLETO: 'Boleto',
  OUTRO: 'Outro',
}

export default async function MyOrdersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/conta/login')
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <MainLayout>
        <main className="min-h-screen py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
                  <p className="text-gray-600">Acompanhe todos os seus pedidos</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/conta">Voltar para Conta</Link>
                </Button>
              </div>

              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
                    <p className="text-gray-600 mb-6">
                      Quando você fizer um pedido, ele aparecerá aqui.
                    </p>
                    <Button asChild>
                      <Link href="/cestas">Ver Produtos</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Pedido {order.code}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Forma de pagamento:{' '}
                              {order.paymentMethodDetail ||
                                (order.paymentMethod ? paymentMethodLabels[order.paymentMethod] : undefined) ||
                                order.paymentMethod ||
                                'Não informado'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}
                            >
                              {statusLabels[order.status]}
                            </span>
                            <p className="text-lg font-bold text-primary mt-2">
                              {formatPrice(Number(order.total))}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2 border-b last:border-0"
                            >
                              <div>
                                <p className="font-medium">
                                  {item.product?.name || item.basketId || 'Produto'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Quantidade: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold">
                                {formatPrice(Number(item.price) * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/acompanhar?code=${order.code}`}>
                              Acompanhar Pedido
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </MainLayout>
      <Footer />
    </>
  )
}
