import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import SubmenuForm from './submenuForm'
import { prisma } from '@/lib/prisma'
import { DeleteNavLinkButton } from '@/components/admin/delete-nav-link-button'

export default async function AdminSubmenuPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/conta/login')
  }

  let links: Array<{ id: string; label: string; link: string; iconUrl?: string | null; order: number; active: boolean }> = []
  try {
    const model: any = (prisma as any).navLink
    if (model?.findMany) {
      links = await model.findMany({
        orderBy: { order: 'asc' },
      })
    } else {
      links = []
    }
  } catch (e) {
    links = []
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Submenu</h1>
            <p className="text-gray-600 mt-1">Gerencie itens com texto, logo e link</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Item</CardTitle>
          </CardHeader>
          <CardContent>
            <SubmenuForm defaultOrder={links.length} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum item cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map((item) => (
                  <div
                    key={item.id}
                    className="group border rounded-xl p-4 flex items-center gap-4 bg-white hover:shadow-sm transition-shadow"
                  >
                    {item.iconUrl ? (
                      <div className="h-12 w-12 rounded-full overflow-hidden border bg-white">
                        <Image src={item.iconUrl} alt={item.label} width={48} height={48} className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-100 border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.label}</p>
                      <Link href={item.link} className="text-xs text-primary truncate block">{item.link}</Link>
                      <p className="text-xs text-gray-500 mt-1">Ordem: {item.order}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DeleteNavLinkButton id={item.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
