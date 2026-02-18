'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Filter } from 'lucide-react'

export function ReportsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (status !== 'all') params.set('status', status)
    router.push(`/admin/relatorios?${params.toString()}`)
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    setStatus('all')
    router.push('/admin/relatorios')
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="RECEBIDO">Pedido confirmado</SelectItem>
                <SelectItem value="SEPARANDO">Separando</SelectItem>
                <SelectItem value="SAIU_PARA_ENTREGA">Saiu para Entrega</SelectItem>
                <SelectItem value="ENTREGUE">Entregue</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
