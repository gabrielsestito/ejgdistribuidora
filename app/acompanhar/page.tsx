'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'

const statusLabels: Record<string, string> = {
  RECEBIDO: 'Pedido confirmado',
  SEPARANDO: 'Separando',
  SAIU_PARA_ENTREGA: 'Saiu para Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

const statusIcons: Record<string, any> = {
  RECEBIDO: Clock,
  SEPARANDO: Package,
  SAIU_PARA_ENTREGA: Truck,
  ENTREGUE: CheckCircle,
  CANCELADO: XCircle,
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!code) {
      setError('Digite o código do pedido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({ code })
      if (email) params.append('email', email)
      if (phone) params.append('phone', phone)

      const response = await fetch(`/api/orders/${code}?${params}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Pedido não encontrado')
      }

      const data = await response.json()
      setOrder(data)
    } catch (err: any) {
      setError(err.message)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (code) {
      handleSearch()
    }
  }, [])

  // Atualizar status a cada 10 segundos se houver pedido
  useEffect(() => {
    if (!order) return

    const interval = setInterval(() => {
      handleSearch()
    }, 10000) // Atualizar a cada 10 segundos

    return () => clearInterval(interval)
  }, [order, code])

  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Acompanhar Pedido</h1>

            {!order ? (
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="code">Código do Pedido</Label>
                      <Input
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Ex: NC123ABC"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email (opcional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone (opcional)</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    {error && (
                      <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                        {error}
                      </div>
                    )}
                    <Button onClick={handleSearch} disabled={loading} className="w-full">
                      {loading ? 'Buscando...' : 'Buscar Pedido'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pedido {order.code}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Data do Pedido</p>
                        <p className="font-semibold">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            // Sempre usar o status do pedido (que já está sincronizado)
                            const Icon = statusIcons[order.status] || Package
                            return <Icon className="h-5 w-5 text-primary" />
                          })()}
                          <span className="font-semibold">
                            {statusLabels[order.status] || order.status}
                          </span>
                        </div>
                        {order.deliveryAssignments?.[0]?.driver && (
                          <p className="text-xs text-gray-500 mt-1">
                            Entregador: {order.deliveryAssignments[0].driver.name}
                            {order.deliveryAssignments[0].status && (
                              <span className="ml-2">
                                ({order.deliveryAssignments[0].status === 'EM_ROTA' ? 'Em Rota' : 
                                  order.deliveryAssignments[0].status === 'ENTREGUE' ? 'Entregue' : 
                                  'Pendente'})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(Number(order.total))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Itens do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-50 rounded"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              {item.product.productType === 'KIT' && item.product.kitItems && (
                                <div className="mt-2 pl-4 border-l-2 border-primary/20">
                                  <p className="text-xs text-gray-500 mb-1">Itens do Kit:</p>
                                  {item.product.kitItems.map((kitItem: any, idx: number) => (
                                    <p key={idx} className="text-xs text-gray-600">
                                      • {kitItem.quantity} {kitItem.unit || 'un'} - {kitItem.product.name}
                                      {kitItem.brand && ` (${kitItem.brand})`}
                                      {kitItem.notes && ` - ${kitItem.notes}`}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="font-semibold ml-4">
                              {formatPrice(Number(item.price) * item.quantity)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {order.address && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Endereço de Entrega</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        {order.address.street}, {order.address.number}
                      </p>
                      {order.address.complement && <p>{order.address.complement}</p>}
                      <p>
                        {order.address.neighborhood} - {order.address.city}/{order.address.state}
                      </p>
                      <p>CEP: {order.address.zipCode}</p>
                    </CardContent>
                  </Card>
                )}

                {order.statusLogs && order.statusLogs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico de Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.statusLogs.map((log: any, index: number) => (
                          <div key={log.id} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                            <div className="flex-1">
                              <p className="font-medium">
                                {statusLabels[log.status]}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                              </p>
                              {log.notes && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {log.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setOrder(null)
                    setCode('')
                    setEmail('')
                    setPhone('')
                    setError('')
                  }}
                >
                  Buscar Outro Pedido
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
