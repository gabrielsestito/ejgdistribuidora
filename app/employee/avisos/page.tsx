import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmployeeLayout } from '@/components/employee/employee-layout'
import { Bell, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EmployeeNoticesList } from '@/components/employee/employee-notices-list'

export default async function EmployeeNoticesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'EMPLOYEE') {
    redirect('/conta/login')
  }

  const notices = await prisma.employeeNotice.findMany({
    where: {
      OR: [
        { employeeId: session.user.id },
        { isGeneral: true },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avisos</h1>
          <p className="text-gray-600 mt-1">Fique por dentro das informações do RH</p>
        </div>

        <EmployeeNoticesList initialNotices={notices} />
      </div>
    </EmployeeLayout>
  )
}
