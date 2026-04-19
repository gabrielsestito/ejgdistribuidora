import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmployeeLayout } from '@/components/employee/employee-layout'
import { Clock, Calendar } from 'lucide-react'

export default async function EmployeeSchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'EMPLOYEE') {
    redirect('/conta/login')
  }

  const schedules = await prisma.employeeSchedule.findMany({
    where: { employeeId: session.user.id },
    orderBy: { dayOfWeek: 'asc' },
  })

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Horários de Trabalho</h1>
          <p className="text-gray-600 mt-1">Confira sua escala de trabalho</p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          {schedules.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Nenhum horário cadastrado</p>
              <p className="text-sm text-gray-400 mt-2">Entre em contato com o RH para definir seus horários</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="p-5 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg text-gray-900">{dayNames[schedule.dayOfWeek]}</h3>
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
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}
