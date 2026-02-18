import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CategoryForm } from '@/components/admin/category-form'

export default async function EditCategoryPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  const category = await prisma.category.findUnique({
    where: { id: params.id },
  })

  if (!category) {
    notFound()
  }

  return <CategoryForm category={category} />
}
