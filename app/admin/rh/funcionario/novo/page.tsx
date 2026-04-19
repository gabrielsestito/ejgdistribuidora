import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { EmployeeForm } from '@/components/admin/employee-form'

export default async function NewEmployeePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  return (
    <AdminLayout>
      <EmployeeForm />
    </AdminLayout>
  )
}
