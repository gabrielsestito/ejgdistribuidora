'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, FileText, Bell, Clock, Plus, Eye, Search, Filter, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Employee {
  id: string
  name: string
  email: string
  active: boolean
  _count: {
    employeeDocuments: number
    employeeNotices: number
  }
}

interface EmployeesListProps {
  employees: Employee[]
}

export function EmployeesList({ employees: initialEmployees }: EmployeesListProps) {
  const [employees] = useState(initialEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'documents' | 'notices'>('name')

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && employee.active) ||
        (statusFilter === 'inactive' && !employee.active)

      return matchesSearch && matchesStatus
    })

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'documents':
          return b._count.employeeDocuments - a._count.employeeDocuments
        case 'notices':
          return b._count.employeeNotices - a._count.employeeNotices
        default:
          return 0
      }
    })

    return filtered
  }, [employees, searchTerm, statusFilter, sortBy])

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all'

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Funcionários</h2>
          <Button asChild>
            <Link href="/admin/rh/funcionario/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="documents">Documentos</SelectItem>
              <SelectItem value="notices">Avisos</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="whitespace-nowrap"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredAndSortedEmployees.length} de {employees.length} funcionários
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead>Avisos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-gray-300" />
                    <p>
                      {hasActiveFilters
                        ? 'Nenhum funcionário encontrado com os filtros aplicados'
                        : 'Nenhum funcionário cadastrado'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('all')
                        }}
                        className="mt-2"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {employee.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                      {employee._count.employeeDocuments}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                      {employee._count.employeeNotices}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/rh/funcionario/${employee.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Gerenciar
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
  )
}
