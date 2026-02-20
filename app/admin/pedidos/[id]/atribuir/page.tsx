'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AssignDeliveryPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Buscar pedido
    fetch(`/api/admin/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Erro ao carregar pedido')
        setLoading(false)
      })

    // Buscar entregadores
    fetch('/api/admin/drivers')
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data)
      })
      .catch(() => {
        setError('Erro ao carregar entregadores')
      })
  }, [params.id])

  const handleAssign = async () => {
    if (!selectedDriver) {
      setError('Selecione um entregador')
      return
    }

    setAssigning(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/orders/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriver }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/admin/pedidos')
      } else {
        setError(data.error || 'Erro ao atribuir entrega')
      }
    } catch (err) {
      setError('Erro ao atribuir entrega')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async () => {
    if (!confirm('Desatribuir entregador deste pedido?')) return
    setAssigning(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/assign`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Erro ao desatribuir entrega')
      } else {
        router.push('/admin/pedidos')
      }
    } catch {
      setError('Erro ao desatribuir entrega')
    } finally {
      setAssigning(false)
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/pedidos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Atribuir Entrega</h1>

        <div className="grid md:grid-cols-2 gap-6">
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
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold">{order.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-primary">
                  {formatPrice(Number(order.total))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold">{order.status}</p>
              </div>
              {order?.deliveryAssignments?.[0]?.driver && (
                <div className="pt-2">
                  <p className="text-sm text-gray-600">Entregador Atual</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                      {order.deliveryAssignments[0].driver.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnassign}
                      disabled={assigning}
                    >
                      Desatribuir
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selecionar Entregador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="driver">Entregador *</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Selecione um entregador" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        Nenhum entregador ativo
                      </div>
                    ) : (
                      drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} {driver.phone ? `- ${driver.phone}` : driver.email ? `- ${driver.email}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleAssign}
                  disabled={!selectedDriver || assigning}
                  className="flex-1"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atribuindo...
                    </>
                  ) : (
                    'Atribuir Entrega'
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/pedidos">Cancelar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
