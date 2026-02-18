'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell, Calendar, Search, Filter, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Notice {
  id: string
  title: string
  message: string
  isGeneral: boolean
  read: boolean
  readAt: Date | null
  createdAt: string | Date
}

interface EmployeeNoticesListProps {
  initialNotices: Notice[]
}

export function EmployeeNoticesList({ initialNotices }: EmployeeNoticesListProps) {
  const [notices, setNotices] = useState(initialNotices)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'personal'>('all')

  const markAsRead = async (noticeId: string) => {
    try {
      const response = await fetch(`/api/employee/notices/${noticeId}/read`, {
        method: 'PATCH',
      })

      if (response.ok) {
        setNotices((prev) =>
          prev.map((n) =>
            n.id === noticeId ? { ...n, read: true, readAt: new Date() } : n
          )
        )
      }
    } catch (error) {
      console.error('Error marking notice as read:', error)
    }
  }

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const matchesSearch =
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.message.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'read' && notice.read) ||
        (statusFilter === 'unread' && !notice.read)

      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'general' && notice.isGeneral) ||
        (typeFilter === 'personal' && !notice.isGeneral)

      return matchesSearch && matchesStatus && matchesType
    })
  }, [notices, searchTerm, statusFilter, typeFilter])

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || typeFilter !== 'all'

  return (
    <>
      {/* Filtros */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por título ou mensagem..."
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
              <SelectItem value="unread">Não lidos</SelectItem>
              <SelectItem value="read">Lidos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="general">Geral</SelectItem>
              <SelectItem value="personal">Pessoal</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setTypeFilter('all')
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
            Mostrando {filteredNotices.length} de {notices.length} avisos
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {filteredNotices.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">
              {hasActiveFilters
                ? 'Nenhum aviso encontrado com os filtros aplicados'
                : 'Nenhum aviso disponível'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setTypeFilter('all')
                }}
                className="mt-4"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                !notice.read ? 'bg-blue-50/50' : ''
              }`}
              onClick={() => !notice.read && markAsRead(notice.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                    {!notice.read && (
                      <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                    )}
                    {notice.isGeneral && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Geral
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">{notice.message}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  )
}
