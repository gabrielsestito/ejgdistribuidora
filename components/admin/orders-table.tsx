'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatPrice, getWhatsAppLink } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, Printer, UserPlus, Search, X, ShoppingCart, Trash2 } from 'lucide-react'

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

const paymentLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  FALHOU: 'Falhou',
  ESTORNADO: 'Estornado',
}

const paymentStatusColors: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800',
  PAGO: 'bg-emerald-100 text-emerald-800',
  FALHOU: 'bg-red-100 text-red-800',
  ESTORNADO: 'bg-purple-100 text-purple-800',
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
interface Order {
  id: string
  code: string
  status: string
  paymentStatus?: string
  paymentMethod?: string | null
  paymentMethodDetail?: string | null
  total: any
  createdAt: string
  user: {
    name: string
    phone?: string | null
  }
  items: Array<{
    quantity: number
  }>
  deliveryAssignments: Array<{
    status?: string
    driver: {
      name: string
      phone?: string | null
    }
  }>
}

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders: initialOrders }: OrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState(initialOrders)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const previousStatus = orders.find(o => o.id === orderId)?.status || ''
    
    // Atualizar localmente imediatamente para feedback instantâneo
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        // Atualizar com os dados completos retornados pela API
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: updatedOrder.status,
                deliveryAssignments: updatedOrder.deliveryAssignments || o.deliveryAssignments,
              }
            }
            return o
          })
        )
      } else {
        // Reverter mudança se falhou
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: previousStatus } : o))
        )
      }
    } catch (error) {
      console.error('Error updating order:', error)
      // Reverter mudança se falhou
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: previousStatus } : o))
      )
    }
  }

  const handlePaymentStatusChange = async (orderId: string, newStatus: string) => {
    const previousStatus = orders.find((o) => o.id === orderId)?.paymentStatus || 'PENDENTE'
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newStatus } : o))
    )

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      })

      if (!response.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, paymentStatus: previousStatus } : o
          )
        )
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, paymentStatus: previousStatus } : o
        )
      )
    }
  }

  const handlePaymentMethodChange = async (orderId: string, newMethod: string) => {
    const previousMethod = orders.find((o) => o.id === orderId)?.paymentMethod || ''
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentMethod: newMethod } : o))
    )

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: newMethod }),
      })

      if (!response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentMethod: previousMethod } : o))
        )
      }
    } catch (error) {
      console.error('Error updating payment method:', error)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentMethod: previousMethod } : o))
      )
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Erro ao excluir pedido')
        return
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch (e) {
      alert('Erro ao excluir pedido')
    }
  }

  const handleUnassign = async (orderId: string) => {
    if (!confirm('Desatribuir entregador deste pedido?')) return
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'Erro ao desatribuir entrega')
        return
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, deliveryAssignments: [] } : o
        )
      )
    } catch (e) {
      alert('Erro ao desatribuir entrega')
    }
  }

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (searchQuery) params.set('search', searchQuery)
    router.push(`/admin/pedidos?${params.toString()}`)
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setSearchQuery('')
    router.push('/admin/pedidos')
  }

  const sendWhatsApp = (phone: string, message: string) => {
    if (!phone) return
    window.open(getWhatsAppLink(phone, message), '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código ou cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFilter}>Filtrar</Button>
              {(statusFilter !== 'all' || searchQuery) && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
              <TableHead>Forma de pagamento</TableHead>
                <TableHead>Entregador</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="h-8 w-8 text-gray-300" />
                      <p>Nenhum pedido encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <Link 
                        href={`/admin/pedidos/${order.id}`} 
                        className="text-primary hover:underline"
                      >
                        {order.code}
                      </Link>
                    </TableCell>
                    <TableCell>{order.user.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</TableCell>
                    <TableCell className="font-semibold">{formatPrice(Number(order.total))}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 shadow-none">
                            <SelectValue>
                              <span className={cn('px-3 py-1.5 rounded-full text-xs font-semibold inline-block cursor-pointer hover:opacity-80 transition-opacity', statusColors[order.status] || 'bg-gray-100 text-gray-800')}>
                                {statusLabels[order.status] || order.status}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {order.deliveryAssignments?.[0] && (
                          <p className="text-xs text-gray-500">
                            Entrega: {order.deliveryAssignments[0].status === 'EM_ROTA' ? 'Em Rota' : 
                                     order.deliveryAssignments[0].status === 'ENTREGUE' ? 'Entregue' : 
                                     'Pendente'}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.paymentStatus || 'PENDENTE'}
                        onValueChange={(value) => handlePaymentStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 shadow-none">
                          <SelectValue>
                            <span className={cn('px-3 py-1.5 rounded-full text-xs font-semibold inline-block cursor-pointer hover:opacity-80 transition-opacity', paymentStatusColors[order.paymentStatus || 'PENDENTE'] || 'bg-gray-100 text-gray-800')}>
                              {paymentLabels[order.paymentStatus || 'PENDENTE']}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <Select
                        value={order.paymentMethod || ''}
                        onValueChange={(value) => handlePaymentMethodChange(order.id, value)}
                      >
                        <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 shadow-none">
                          <SelectValue>
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold inline-block cursor-pointer hover:opacity-80 transition-opacity bg-gray-100 text-gray-800">
                              {order.paymentMethod ? paymentMethodLabels[order.paymentMethod] : 'Selecionar'}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(paymentMethodLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {order.paymentMethodDetail && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          {order.paymentMethodDetail}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.deliveryAssignments[0]?.driver?.name ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                            {order.deliveryAssignments[0].driver.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Desatribuir entregador"
                            onClick={() => handleUnassign(order.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/pedidos/${order.id}/atribuir`}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Atribuir
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(order.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            sendWhatsApp(
                              order.user.phone || '',
                              `Olá ${order.user.name}, seu pedido ${order.code} está com status: ${statusLabels[order.status]}`
                            )
                          }
                          disabled={!order.user.phone}
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/pedidos/${order.id}/imprimir`} target="_blank" title="Imprimir">
                            <Printer className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
