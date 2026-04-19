'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Plus, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notice {
  id: string
  title: string
  message: string
  isGeneral: boolean
  read: boolean
  createdAt: Date
}

interface EmployeeNoticesTabProps {
  employeeId: string
  initialNotices: Notice[]
}

export function EmployeeNoticesTab({ employeeId, initialNotices }: EmployeeNoticesTabProps) {
  const [notices, setNotices] = useState(initialNotices)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/rh/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          title: formData.title,
          message: formData.message,
          isGeneral: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar aviso')
      }

      const newNotice = await response.json()
      setNotices((prev) => [newNotice, ...prev])
      setFormData({ title: '', message: '' })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating notice:', error)
      alert('Erro ao criar aviso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (noticeId: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return

    try {
      const response = await fetch(`/api/admin/rh/notices/${noticeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir aviso')
      }

      setNotices((prev) => prev.filter((n) => n.id !== noticeId))
    } catch (error) {
      console.error('Error deleting notice:', error)
      alert('Erro ao excluir aviso')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Avisos do Funcionário</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Aviso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Aviso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Ex: Reunião importante"
                />
              </div>

              <div>
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  required
                  placeholder="Conteúdo do aviso"
                  rows={5}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {notices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Nenhum aviso cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`p-4 border rounded-lg ${
                !notice.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{notice.title}</h4>
                    {!notice.read && <span className="h-2 w-2 bg-blue-600 rounded-full" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notice.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(notice.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors ml-2"
                  title="Excluir"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
