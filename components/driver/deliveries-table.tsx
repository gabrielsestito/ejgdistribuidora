'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Truck, CheckCircle, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface Delivery {
  id: string
  status: string
  order: {
    code: string
    total: any
    user: {
      name: string
      phone?: string | null
    }
    address: {
      street: string
      number: string
      complement?: string | null
      neighborhood: string
      city: string
      state: string
      zipCode: string
    }
    items: Array<{
      id: string
      quantity: number
      price: any
      product?: {
        name: string
      } | null
      basket?: {
        name: string
      } | null
    }>
  }
}

interface DeliveriesTableProps {
  deliveries: Delivery[]
}

export function DeliveriesTable({ deliveries: initialDeliveries }: DeliveriesTableProps) {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState(initialDeliveries)
  const [optimizing, setOptimizing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [notes, setNotes] = useState('')

  const storageKey = useMemo(() => {
    return `driver-deliveries-order:${deliveries.map((d) => d.status).join(',')}`
  }, [deliveries])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return
    try {
      const orderedIds: string[] = JSON.parse(saved)
      if (!Array.isArray(orderedIds) || orderedIds.length === 0) return
      setDeliveries((prev) => {
        const byId = new Map(prev.map((item) => [item.id, item]))
        const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Delivery[]
        const remaining = prev.filter((item) => !orderedIds.includes(item.id))
        return [...ordered, ...remaining]
      })
    } catch {
      // ignore
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify(deliveries.map((d) => d.id)))
  }, [deliveries, storageKey])

  const moveDelivery = (index: number, direction: 'up' | 'down') => {
    setDeliveries((prev) => {
      const next = [...prev]
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= next.length) return prev
      const [removed] = next.splice(index, 1)
      next.splice(newIndex, 0, removed)
      return next
    })
  }

  const toggleDetails = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const autoOrganize = async () => {
    if (deliveries.length < 2) return
    setOptimizing(true)
    try {
      // Solicitar localização do entregador
      let driverLocation: { lat: number; lng: number } | null = null
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocalização não suportada'))
            return
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          })
        })
        
        driverLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
      } catch (geoError) {
        console.warn('Erro ao obter localização:', geoError)
        // Continua sem a localização, usando o primeiro endereço como ponto de partida
      }

      const stops = deliveries.map((delivery) => ({
        orderId: delivery.order.code,
        code: delivery.order.code,
        customerName: delivery.order.user.name,
        phone: delivery.order.user.phone,
        address: delivery.order.address,
      }))
      
      const response = await fetch('/api/driver/route/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stops,
          driverLocation, // Enviar localização do entregador
        }),
      })
      const json = await response.json()
      if (response.ok && Array.isArray(json.stops)) {
        const orderIds = json.stops.map((stop: any) => stop.orderId)
        setDeliveries((prev) => {
          const byCode = new Map(prev.map((item) => [item.order.code, item]))
          const ordered = orderIds.map((id: string) => byCode.get(id)).filter(Boolean) as Delivery[]
          const remaining = prev.filter((item) => !orderIds.includes(item.order.code))
          return [...ordered, ...remaining]
        })
      }
    } catch (error) {
      console.error('Error organizing deliveries:', error)
    } finally {
      setOptimizing(false)
    }
  }

  const handleStartDelivery = async (deliveryId: string) => {
    // Atualizar imediatamente para feedback instantâneo
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, status: 'EM_ROTA' } : d))
    )

    try {
      const response = await fetch(`/api/driver/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EM_ROTA' }),
      })

      if (!response.ok) {
        // Reverter se falhou
        setDeliveries((prev) =>
          prev.map((d) => (d.id === deliveryId ? { ...d, status: 'PENDENTE' } : d))
        )
      }
    } catch (error) {
      console.error('Error starting delivery:', error)
      // Reverter se falhou
      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status: 'PENDENTE' } : d))
      )
    }
  }

  const handleConfirmDelivery = async () => {
    if (!selectedDelivery || !recipientName) return

    // Atualizar imediatamente para feedback instantâneo
    setDeliveries((prev) =>
      prev.map((d) => (d.id === selectedDelivery.id ? { ...d, status: 'ENTREGUE' } : d))
    )
    setConfirmOpen(false)
    const previousDelivery = selectedDelivery
    const previousName = recipientName
    const previousNotes = notes
    setSelectedDelivery(null)
    setRecipientName('')
    setNotes('')

    try {
      const response = await fetch(`/api/driver/deliveries/${previousDelivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ENTREGUE',
          recipientName: previousName,
          notes: previousNotes,
        }),
      })

      if (!response.ok) {
        // Reverter se falhou
        setDeliveries((prev) =>
          prev.map((d) => (d.id === previousDelivery.id ? { ...d, status: previousDelivery.status } : d))
        )
        setSelectedDelivery(previousDelivery)
        setRecipientName(previousName)
        setNotes(previousNotes)
        setConfirmOpen(true)
      }
    } catch (error) {
      console.error('Error confirming delivery:', error)
      // Reverter se falhou
      setDeliveries((prev) =>
        prev.map((d) => (d.id === previousDelivery.id ? { ...d, status: previousDelivery.status } : d))
      )
      setSelectedDelivery(previousDelivery)
      setRecipientName(previousName)
      setNotes(previousNotes)
      setConfirmOpen(true)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          {deliveries.length} entrega{deliveries.length === 1 ? '' : 's'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={autoOrganize}
          disabled={deliveries.length < 2 || optimizing}
        >
          <Sparkles className="h-4 w-4" />
          {optimizing ? 'Organizando...' : 'Organizar automaticamente'}
        </Button>
      </div>

      <div className="space-y-4 md:hidden">
        {deliveries.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
            Nenhuma entrega atribuída.
          </div>
        ) : (
          deliveries.map((delivery, index) => (
            <div key={delivery.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Pedido {delivery.order.code}
                  </p>
                  <p className="text-sm text-gray-600">{delivery.order.user.name}</p>
                  {delivery.order.user.phone && (
                    <p className="text-xs text-gray-500">{delivery.order.user.phone}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    delivery.status === 'EM_ROTA'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {delivery.status === 'EM_ROTA' ? 'Em Rota' : 'Pendente'}
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <p>
                  {delivery.order.address.street}, {delivery.order.address.number}
                </p>
                <p>
                  {delivery.order.address.neighborhood} - {delivery.order.address.city}/
                  {delivery.order.address.state}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(Number(delivery.order.total))}
                </p>
                {delivery.status === 'PENDENTE' ? (
                  <Button size="sm" onClick={() => handleStartDelivery(delivery.id)}>
                    <Truck className="mr-2 h-4 w-4" />
                    Iniciar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDelivery(delivery)
                      setConfirmOpen(true)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar
                  </Button>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDetails(delivery.id)}
                >
                  {expanded[delivery.id] ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Ocultar detalhes
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveDelivery(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveDelivery(index, 'down')}
                    disabled={index === deliveries.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {expanded[delivery.id] && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-600 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Endereço completo</p>
                    <p>
                      {delivery.order.address.street}, {delivery.order.address.number}
                      {delivery.order.address.complement ? `, ${delivery.order.address.complement}` : ''}
                    </p>
                    <p>
                      {delivery.order.address.neighborhood} - {delivery.order.address.city}/
                      {delivery.order.address.state} • {delivery.order.address.zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Itens do pedido</p>
                    <div className="space-y-1">
                      {delivery.order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span>
                            {item.quantity}x {item.product?.name || item.basket?.name || 'Item'}
                          </span>
                          <span className="text-gray-500">
                            {formatPrice(Number(item.price))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-white rounded-lg border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Nenhuma entrega atribuída.
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery, index) => (
                <Fragment key={delivery.id}>
                  <TableRow>
                  <TableCell className="font-medium">
                    {delivery.order.code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{delivery.order.user.name}</p>
                      {delivery.order.user.phone && (
                        <p className="text-sm text-gray-600">
                          {delivery.order.user.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>
                        {delivery.order.address.street},{' '}
                        {delivery.order.address.number}
                      </p>
                      <p>
                        {delivery.order.address.neighborhood} -{' '}
                        {delivery.order.address.city}/{delivery.order.address.state}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatPrice(Number(delivery.order.total))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        delivery.status === 'EM_ROTA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {delivery.status === 'EM_ROTA' ? 'Em Rota' : 'Pendente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleDetails(delivery.id)}
                        title={expanded[delivery.id] ? 'Ocultar detalhes' : 'Ver detalhes'}
                      >
                        {expanded[delivery.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveDelivery(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveDelivery(index, 'down')}
                        disabled={index === deliveries.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      {delivery.status === 'PENDENTE' ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartDelivery(delivery.id)}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Iniciar Entrega
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDelivery(delivery)
                            setConfirmOpen(true)
                          }}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirmar Entrega
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {expanded[delivery.id] && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-gray-50">
                      <div className="grid grid-cols-2 gap-6 p-4 text-sm text-gray-700">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Endereço completo</p>
                          <p>
                            {delivery.order.address.street}, {delivery.order.address.number}
                            {delivery.order.address.complement ? `, ${delivery.order.address.complement}` : ''}
                          </p>
                          <p>
                            {delivery.order.address.neighborhood} - {delivery.order.address.city}/
                            {delivery.order.address.state} • {delivery.order.address.zipCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Itens do pedido</p>
                          <div className="space-y-1">
                            {delivery.order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between">
                                <span>
                                  {item.quantity}x {item.product?.name || item.basket?.name || 'Item'}
                                </span>
                                <span className="text-gray-500">
                                  {formatPrice(Number(item.price))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrega</DialogTitle>
            <DialogDescription>
              Confirme os dados da entrega do pedido {selectedDelivery?.order.code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipientName">Nome de quem recebeu *</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a entrega..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={!recipientName}
            >
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
