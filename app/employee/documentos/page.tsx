import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmployeeLayout } from '@/components/employee/employee-layout'
import { EmployeeDocumentsList } from '@/components/employee/employee-documents-list'

export default async function EmployeeDocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'EMPLOYEE') {
    redirect('/conta/login')
  }

  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Documentos</h1>
          <p className="text-gray-600 mt-1">Acesse seus documentos do RH</p>
        </div>

        <EmployeeDocumentsList initialDocuments={documents} />
      </div>
    </EmployeeLayout>
  )
}
