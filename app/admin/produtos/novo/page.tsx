import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProductForm } from '@/components/admin/product-form'

export default async function NewProductPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  return <ProductForm />
}
