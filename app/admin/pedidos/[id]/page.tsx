'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Loader2, Save, Printer, Truck, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingDriver, setChangingDriver] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false)

  const paymentLabels: Record<string, string> = {
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    FALHOU: 'Falhou',
    ESTORNADO: 'Estornado',
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

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data)
        setNotes(data.notes || '')
        setPaymentMethod(data.paymentMethod || '')
        if (data.deliveryAssignments?.[0]?.driver) {
          setSelectedDriver(data.deliveryAssignments[0].driver.id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Buscar entregadores
    fetch('/api/admin/drivers')
      .then((res) => res.json())
      .then((data) => setDrivers(data))
      .catch(console.error)
  }, [params.id])

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(data)
        alert('Observações salvas com sucesso!')
      } else {
        alert('Erro ao salvar observações')
      }
    } catch (error) {
      alert('Erro ao salvar observações')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeDriver = async () => {
    if (!selectedDriver) {
      alert('Selecione um entregador')
      return
    }

    setChangingDriver(true)
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriver }),
      })

      if (response.ok) {
        // Recarregar dados do pedido
        const orderResponse = await fetch(`/api/admin/orders/${params.id}`)
        const orderData = await orderResponse.json()
        setOrder(orderData)
        if (orderData.deliveryAssignments?.[0]?.driver) {
          setSelectedDriver(orderData.deliveryAssignments[0].driver.id)
        }
        alert('Entregador alterado com sucesso!')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao alterar entregador')
      }
    } catch (error) {
      alert('Erro ao alterar entregador')
    } finally {
      setChangingDriver(false)
    }
  }

  const handleSavePaymentMethod = async () => {
    setSavingPaymentMethod(true)
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(data)
        setPaymentMethod(data.paymentMethod || '')
        alert('Forma de pagamento atualizada!')
      } else {
        alert('Erro ao atualizar forma de pagamento')
      }
    } catch (error) {
      alert('Erro ao atualizar forma de pagamento')
    } finally {
      setSavingPaymentMethod(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Pedido não encontrado</p>
          <Button asChild>
            <Link href="/admin/pedidos">Voltar</Link>
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/admin/pedidos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/pedidos/${params.id}/imprimir`} target="_blank">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Pedido {order.code}</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Informações do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Código</p>
                  <p className="font-semibold">{order.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">{order.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pagamento</p>
                  <p className="font-semibold">
                    {paymentLabels[order.paymentStatus || 'PENDENTE']}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Forma de pagamento</p>
                  <div className="mt-2 flex flex-col gap-3">
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                        <SelectItem value="PIX">Pix</SelectItem>
                        <SelectItem value="CARTAO_CREDITO">Cartão de crédito</SelectItem>
                        <SelectItem value="CARTAO_DEBITO">Cartão de débito</SelectItem>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="BOLETO">Boleto</SelectItem>
                        <SelectItem value="OUTRO">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleSavePaymentMethod}
                      disabled={savingPaymentMethod}
                      variant="outline"
                      className="w-full"
                    >
                      {savingPaymentMethod ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Salvar forma de pagamento
                        </>
                      )}
                    </Button>
                    {order.paymentMethodDetail ? (
                      <p className="text-xs text-gray-500">
                        {order.paymentMethodDetail}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {paymentMethodLabels[order.paymentMethod] ||
                          order.paymentMethod ||
                          'Não informado'}
                      </p>
                    )}
                  </div>
                </div>
                {order.mercadoPagoId && (
                  <div>
                    <p className="text-sm text-gray-600">ID Mercado Pago</p>
                    <p className="font-semibold">{order.mercadoPagoId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(Number(order.total))}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Nome:</strong> {order.user.name}</p>
                <p><strong>Email:</strong> {order.user.email}</p>
                {order.user.phone && <p><strong>Telefone:</strong> {order.user.phone}</p>}
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p>
                  {order.address.street}, {order.address.number}
                  {order.address.complement && ` - ${order.address.complement}`}
                </p>
                <p>
                  {order.address.neighborhood} - {order.address.city}/{order.address.state}
                </p>
                <p>CEP: {order.address.zipCode}</p>
                {order.address.reference && (
                  <p className="text-gray-600 italic">Referência: {order.address.reference}</p>
                )}
              </CardContent>
            </Card>

            {/* Itens */}
            <Card>
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || 'Produto removido'}</p>
                        {item.product?.productType === 'KIT' && item.product?.kitItems && (
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
                        <p className="text-sm text-gray-600 mt-1">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold ml-4">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Entregador */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Entregador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.deliveryAssignments?.[0]?.driver ? (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Entregador Atual</p>
                      <p className="font-semibold">{order.deliveryAssignments[0].driver.name}</p>
                      <p className="text-xs text-gray-500">{order.deliveryAssignments[0].driver.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: {order.deliveryAssignments[0].status === 'PENDENTE' ? 'Pendente' :
                                 order.deliveryAssignments[0].status === 'EM_ROTA' ? 'Em Rota' :
                                 order.deliveryAssignments[0].status === 'ENTREGUE' ? 'Entregue' :
                                 order.deliveryAssignments[0].status}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="driver">Alterar Entregador</Label>
                      <Select
                        value={selectedDriver}
                        onValueChange={setSelectedDriver}
                      >
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Selecione um entregador" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name} {driver.email && `- ${driver.email}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleChangeDriver}
                      disabled={changingDriver || selectedDriver === order.deliveryAssignments[0].driver.id}
                      className="w-full"
                      variant="outline"
                    >
                      {changingDriver ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        <>
                          <Truck className="mr-2 h-4 w-4" />
                          Alterar Entregador
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-2">Nenhum entregador atribuído</p>
                    <div>
                      <Label htmlFor="driver">Atribuir Entregador</Label>
                      <Select
                        value={selectedDriver}
                        onValueChange={setSelectedDriver}
                      >
                        <SelectTrigger className="h-11 mt-2">
                          <SelectValue placeholder="Selecione um entregador" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name} {driver.email && `- ${driver.email}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleChangeDriver}
                      disabled={changingDriver || !selectedDriver}
                      className="w-full"
                    >
                      {changingDriver ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Atribuindo...
                        </>
                      ) : (
                        <>
                          <Truck className="mr-2 h-4 w-4" />
                          Atribuir Entregador
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre este pedido..."
                    rows={8}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Observações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frete</span>
                  <span>{formatPrice(Number(order.shipping))}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatPrice(Number(order.total))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
