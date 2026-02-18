'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, ArrowLeft, Search, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
}

export function EmployeeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    if (isDialogOpen && mode === 'select') {
      fetchUsers()
    }
  }, [isDialogOpen, mode])

  const fetchUsers = async () => {
    setSearchLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas usuários que não são EMPLOYEE
        const nonEmployees = data.filter((user: User) => user.role !== 'EMPLOYEE')
        setUsers(nonEmployees)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setIsDialogOpen(false)
    setMode('select')
  }

  const handleCreateEmployee = async () => {
    if (mode === 'select' && selectedUser) {
      // Atualizar role do usuário existente
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'EMPLOYEE' }),
        })

        if (response.ok) {
          const user = await response.json()
          router.push(`/admin/rh/funcionario/${user.id}`)
          router.refresh()
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao atualizar usuário')
        }
      } catch (error) {
        console.error('Error updating user:', error)
        alert('Erro ao atualizar usuário')
      } finally {
        setLoading(false)
      }
    } else {
      // Criar novo usuário
      setLoading(true)
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            role: 'EMPLOYEE',
            active: true,
          }),
        })

        if (response.ok) {
          const user = await response.json()
          router.push(`/admin/rh/funcionario/${user.id}`)
          router.refresh()
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao criar funcionário')
        }
      } catch (error) {
        console.error('Error creating employee:', error)
        alert('Erro ao criar funcionário')
      } finally {
        setLoading(false)
      }
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/rh">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Novo Funcionário</h1>
            <p className="text-gray-600 mt-1">
              Selecione um usuário existente ou crie um novo funcionário
            </p>
          </div>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold">Adicionar Funcionário</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Modo de seleção */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={mode === 'select' ? 'default' : 'outline'}
                  onClick={() => {
                    setMode('select')
                    setSelectedUser(null)
                    setFormData({ name: '', email: '', phone: '', password: '' })
                  }}
                  className="flex-1"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Selecionar Usuário Existente
                </Button>
                <Button
                  type="button"
                  variant={mode === 'create' ? 'default' : 'outline'}
                  onClick={() => {
                    setMode('create')
                    setSelectedUser(null)
                    setFormData({ name: '', email: '', phone: '', password: '' })
                  }}
                  className="flex-1"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Novo Usuário
                </Button>
              </div>

              {mode === 'select' && (
                <div className="space-y-4">
                  {selectedUser ? (
                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                          <p className="text-sm text-gray-600">{selectedUser.email}</p>
                          {selectedUser.phone && (
                            <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Role atual: {selectedUser.role === 'CUSTOMER' ? 'Cliente' : selectedUser.role === 'DRIVER' ? 'Entregador' : selectedUser.role}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(null)}
                        >
                          Alterar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full">
                          <Search className="mr-2 h-4 w-4" />
                          Buscar Usuário
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Selecionar Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Buscar por nome ou email..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                            {searchLoading ? (
                              <div className="p-8 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500">Carregando usuários...</p>
                              </div>
                            ) : filteredUsers.length === 0 ? (
                              <div className="p-8 text-center">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">
                                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                                </p>
                              </div>
                            ) : (
                              <div className="divide-y">
                                {filteredUsers.map((user) => (
                                  <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                  >
                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                    {user.phone && (
                                      <p className="text-sm text-gray-600">{user.phone}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {user.role === 'CUSTOMER' ? 'Cliente' : user.role === 'DRIVER' ? 'Entregador' : user.role}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}

              {mode === 'create' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Ex: João Silva"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="exemplo@email.com"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                      Senha *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="h-11"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-11"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateEmployee}
                disabled={
                  loading ||
                  (mode === 'select' && !selectedUser) ||
                  (mode === 'create' && (!formData.name || !formData.email || !formData.password))
                }
                className="h-11 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'select' ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : mode === 'select' ? (
                  'Adicionar como Funcionário'
                ) : (
                  'Criar Funcionário'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
