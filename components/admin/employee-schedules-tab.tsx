'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Clock, Plus, Trash2 } from 'lucide-react'

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStart: string | null
  breakEnd: string | null
  notes: string | null
}

interface EmployeeSchedulesTabProps {
  employeeId: string
  initialSchedules: Schedule[]
}

const dayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export function EmployeeSchedulesTab({ employeeId, initialSchedules }: EmployeeSchedulesTabProps) {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    dayOfWeek: '1',
    startTime: '08:00',
    endTime: '17:00',
    breakStart: '',
    breakEnd: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/rh/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          dayOfWeek: parseInt(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
          breakStart: formData.breakStart || null,
          breakEnd: formData.breakEnd || null,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar horário')
      }

      const newSchedule = await response.json()
      setSchedules((prev) => [...prev, newSchedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek))
      setFormData({
        dayOfWeek: '1',
        startTime: '08:00',
        endTime: '17:00',
        breakStart: '',
        breakEnd: '',
        notes: '',
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating schedule:', error)
      alert('Erro ao criar horário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este horário?')) return

    try {
      const response = await fetch(`/api/admin/rh/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir horário')
      }

      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('Erro ao excluir horário')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Horários de Trabalho</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Horário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Horário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="dayOfWeek">Dia da Semana *</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, dayOfWeek: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Horário de Entrada *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Horário de Saída *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="breakStart">Início do Intervalo</Label>
                  <Input
                    id="breakStart"
                    type="time"
                    value={formData.breakStart}
                    onChange={(e) => setFormData((prev) => ({ ...prev, breakStart: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="breakEnd">Fim do Intervalo</Label>
                  <Input
                    id="breakEnd"
                    type="time"
                    value={formData.breakEnd}
                    onChange={(e) => setFormData((prev) => ({ ...prev, breakEnd: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o horário"
                  rows={3}
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

      {schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Nenhum horário cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg text-gray-900">{dayNames[schedule.dayOfWeek]}</h4>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Entrada:</span>
                  <span className="font-semibold text-gray-900">{schedule.startTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Saída:</span>
                  <span className="font-semibold text-gray-900">{schedule.endTime}</span>
                </div>
                {schedule.breakStart && schedule.breakEnd && (
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Intervalo:</span>
                      <span className="text-sm font-medium text-gray-700">
                        {schedule.breakStart} - {schedule.breakEnd}
                      </span>
                    </div>
                  </div>
                )}
                {schedule.notes && (
                  <div className="pt-2 mt-2 border-t">
                    <p className="text-xs text-gray-500">{schedule.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
