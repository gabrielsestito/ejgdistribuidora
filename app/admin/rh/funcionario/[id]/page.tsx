import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminLayout } from '@/components/admin/admin-layout'
import { EmployeeManagement } from '@/components/admin/employee-management'

export default async function EmployeeManagementPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const employee = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      employeeDocuments: {
        orderBy: { createdAt: 'desc' },
      },
      employeeNotices: {
        orderBy: { createdAt: 'desc' },
      },
      employeeSchedules: {
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  })

  if (!employee || employee.role !== 'EMPLOYEE') {
    redirect('/admin/rh')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Funcionário</h1>
          <p className="text-gray-600 mt-1">{employee.name}</p>
        </div>

        <EmployeeManagement employee={employee} />
      </div>
    </AdminLayout>
  )
}
