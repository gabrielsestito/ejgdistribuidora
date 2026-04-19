'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react'
import { BannerDialog } from '@/components/admin/banner-dialog'
import Image from 'next/image'

interface Banner {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  image?: string | null
  link?: string | null
  bgColor: string
  textColor: string
  order: number
  active: boolean
  isMain?: boolean
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      const data = await res.json()
      setBanners(data)
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchBanners()
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !banner.active }),
      })

      if (res.ok) {
        fetchBanners()
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-gray-500">Carregando banners...</div>
      </AdminLayout>
    )
  }

  const mainBanners = banners.filter(b => b.isMain)
  const carouselBanners = banners.filter(b => !b.isMain)

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
            <p className="text-gray-600 mt-1">Gerencie os banners da home page</p>
          </div>
          <Button onClick={() => {
            setEditingBanner(null)
            setDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Banner
          </Button>
        </div>

        {banners.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum banner cadastrado</h3>
              <p className="text-gray-600 mb-6">
                Crie seu primeiro banner para exibir na home page.
              </p>
              <Button onClick={() => {
                setEditingBanner(null)
                setDialogOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {mainBanners.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Banner Principal (Acima do Carrossel)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mainBanners.map((banner) => (
                    <Card key={banner.id} className={`border-gray-200 ${!banner.active ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{banner.title}</CardTitle>
                            <p className="text-sm text-gray-500">Ordem: {banner.order}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(banner)}
                              title={banner.active ? 'Desativar' : 'Ativar'}
                            >
                              {banner.active ? (
                                <Eye className="h-4 w-4 text-gray-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingBanner(banner)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(banner.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {banner.image && (
                          <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={banner.image}
                              alt={banner.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        )}
                        {banner.link && (
                          <p className="text-xs text-primary mt-2 truncate">
                            Link: {banner.link}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {carouselBanners.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Banners do Carrossel</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {carouselBanners.map((banner) => (
                    <Card key={banner.id} className={`border-gray-200 ${!banner.active ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{banner.title}</CardTitle>
                            <p className="text-sm text-gray-500">Ordem: {banner.order}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(banner)}
                              title={banner.active ? 'Desativar' : 'Ativar'}
                            >
                              {banner.active ? (
                                <Eye className="h-4 w-4 text-gray-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingBanner(banner)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(banner.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {banner.image && (
                          <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={banner.image}
                              alt={banner.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                        )}
                        {banner.link && (
                          <p className="text-xs text-primary mt-2 truncate">
                            Link: {banner.link}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <BannerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          banner={editingBanner}
          onSuccess={fetchBanners}
        />
      </div>
    </AdminLayout>
  )
}
