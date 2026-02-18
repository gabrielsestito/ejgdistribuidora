import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { RHStats } from '@/components/admin/rh-stats'
import { EmployeesList } from '@/components/admin/employees-list'

export default async function RHPanelPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const [employees, totalDocuments, totalNotices] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        _count: {
          select: {
            employeeDocuments: true,
            employeeNotices: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.employeeDocument.count(),
    prisma.employeeNotice.count({
      where: { isGeneral: true },
    }),
  ])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel de RH</h1>
          <p className="text-gray-600 mt-1">Gerencie funcionários, documentos e avisos</p>
        </div>

        <RHStats
          totalEmployees={employees.length}
          totalDocuments={totalDocuments}
          totalNotices={totalNotices}
        />

        <EmployeesList employees={employees} />
      </div>
    </AdminLayout>
  )
}
