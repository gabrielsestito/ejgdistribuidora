'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CategoryFormProps {
  category?: {
    id: string
    name: string
    slug: string
    description: string | null
    image: string | null
    active: boolean
    showInMenu: boolean
  }
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [image, setImage] = useState<string | null>(category?.image || null)
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    active: category?.active ?? true,
    showInMenu: category?.showInMenu ?? false,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'categories')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await res.json()
      if (data.url) {
        setImage(data.url)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        image,
      }

      const url = category ? `/api/admin/categories/${category.id}` : '/api/admin/categories'
      const method = category ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/admin/categorias')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Erro ao salvar categoria')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Erro ao salvar categoria')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/categorias">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {category ? 'Editar Categoria' : 'Nova Categoria'}
              </h1>
              <p className="text-gray-600 mt-1">
                {category ? 'Atualize as informações da categoria' : 'Preencha os dados para criar uma nova categoria'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold">Informações da Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Nome da Categoria *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Ex: Bebidas"
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Descreva a categoria..."
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="image-upload" className="text-sm font-medium text-gray-700 mb-2 block">
                  Imagem da Categoria
                </Label>
                <div className="space-y-4">
                  {image && (
                    <div className="relative w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-200 group">
                      <Image
                        src={image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={() => setImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          {uploading ? 'Enviando...' : image ? 'Trocar Imagem' : 'Clique para adicionar imagem'}
                        </span>
                      </div>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="active" className="cursor-pointer text-sm font-medium text-gray-700">
                    Categoria ativa
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showInMenu"
                    checked={formData.showInMenu}
                    onChange={(e) => setFormData((prev) => ({ ...prev, showInMenu: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="showInMenu" className="cursor-pointer text-sm font-medium text-gray-700">
                    Mostrar no menu e no "Navegue pelas categorias"
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-11"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-11 min-w-[140px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Categoria'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
