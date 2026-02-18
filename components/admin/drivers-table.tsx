'use client'

import { useState } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Driver {
  id: string
  name: string
  email: string
  phone?: string | null
  active: boolean
  _count: {
    deliveryAssignments: number
  }
}

interface DriversTableProps {
  drivers: Driver[]
}

export function DriversTable({ drivers: initialDrivers }: DriversTableProps) {
  const [drivers, setDrivers] = useState(initialDrivers)

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: !currentActive } : d))
    )

    try {
      const response = await fetch(`/api/admin/drivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!response.ok) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === id ? { ...d, active: currentActive } : d))
        )
      }
    } catch (error) {
      console.error('Error toggling driver:', error)
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, active: currentActive } : d))
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este entregador?')) return
    try {
      const res = await fetch(`/api/admin/drivers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Erro ao excluir entregador')
        return
      }
      setDrivers((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Erro ao excluir entregador')
    }
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Entregas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Nenhum entregador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.email}</TableCell>
                  <TableCell>{driver.phone || '-'}</TableCell>
                  <TableCell>{driver._count.deliveryAssignments}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        driver.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {driver.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(driver.id, driver.active)}
                    >
                      {driver.active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(driver.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
