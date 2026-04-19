'use client'

import { useState } from 'react'
import { Eye, EyeOff, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  active: boolean
  createdAt: any
  _count: {
    orders: number
    deliveryAssignments: number
  }
}

interface UsersTableProps {
  users: User[]
}

const roleLabels: Record<string, string> = {
  CUSTOMER: 'Cliente',
  ADMIN: 'Administrador',
  DRIVER: 'Entregador',
  EMPLOYEE: 'Funcionário',
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !currentActive } : u))
    )

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, active: currentActive } : u))
        )
      }
    } catch (error) {
      console.error('Error toggling user:', error)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: currentActive } : u))
      )
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    const previousRole = users.find(u => u.id === id)?.role || ''
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    )

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: previousRole } : u))
        )
      }
    } catch (error) {
      console.error('Error changing role:', error)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: previousRole } : u))
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Erro ao excluir usuário')
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      alert('Erro ao excluir usuário')
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
              <TableHead>Função</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Cliente</SelectItem>
                        <SelectItem value="DRIVER">Entregador</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.role === 'CUSTOMER' ? user._count.orders : user._count.deliveryAssignments}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(user.id, user.active)}
                    >
                      {user.active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
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
