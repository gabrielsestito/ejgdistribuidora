import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmployeeLayout } from '@/components/employee/employee-layout'
import { FileText, AlertTriangle, Clock, Bell, Download } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function EmployeeDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'EMPLOYEE') {
    redirect('/conta/login')
  }

  const [documents, notices, schedules] = await Promise.all([
    prisma.employeeDocument.findMany({
      where: { employeeId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.employeeNotice.findMany({
      where: {
        OR: [
          { employeeId: session.user.id },
          { isGeneral: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.employeeSchedule.findMany({
      where: { employeeId: session.user.id },
      orderBy: { dayOfWeek: 'asc' },
    }),
  ])

  const unreadNotices = notices.filter(n => !n.read).length

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Funcionário</h1>
          <p className="text-gray-600 mt-1">Bem-vindo, {session.user.name}</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documentos</p>
                <p className="text-2xl font-bold mt-1">{documents.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avisos</p>
                <p className="text-2xl font-bold mt-1">
                  {unreadNotices > 0 && (
                    <span className="text-red-600">{unreadNotices} novos</span>
                  )}
                  {unreadNotices === 0 && notices.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horários</p>
                <p className="text-2xl font-bold mt-1">{schedules.length} dias</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Documentos Recentes */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Documentos Recentes</h2>
                <Link href="/employee/documentos" className="text-sm text-primary hover:underline">
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="p-6">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum documento disponível</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          doc.type === 'HOLERITE' ? 'bg-green-100' :
                          doc.type === 'ADVERTENCIA' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {doc.type === 'HOLERITE' ? (
                            <FileText className="h-5 w-5 text-green-600" />
                          ) : doc.type === 'ADVERTENCIA' ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{doc.title}</p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-5 w-5 text-gray-600" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Avisos Recentes */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Avisos Recentes</h2>
                <Link href="/employee/avisos" className="text-sm text-primary hover:underline">
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="p-6">
              {notices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum aviso disponível</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                      className={`p-4 border rounded-lg ${
                        !notice.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                        {!notice.read && (
                          <span className="h-2 w-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notice.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horários de Trabalho */}
        {schedules.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Meus Horários de Trabalho</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 border rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">{dayNames[schedule.dayOfWeek]}</p>
                    <p className="text-sm text-gray-600">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                    {schedule.breakStart && schedule.breakEnd && (
                      <p className="text-xs text-gray-500 mt-1">
                        Intervalo: {schedule.breakStart} - {schedule.breakEnd}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  )
}
