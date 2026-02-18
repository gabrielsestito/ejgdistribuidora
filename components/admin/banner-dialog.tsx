'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X } from 'lucide-react'
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
}

interface BannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner: Banner | null
  onSuccess: () => void
}

export function BannerDialog({ open, onOpenChange, banner, onSuccess }: BannerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '',
    bgColor: 'bg-primary',
    textColor: 'text-white',
    order: 0,
    active: true,
    isMain: false,
  })

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        image: banner.image || '',
        link: banner.link || '',
        bgColor: banner.bgColor,
        textColor: banner.textColor,
        order: banner.order,
        active: banner.active,
        isMain: (banner as any).isMain || false,
      })
    } else {
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        image: '',
        link: '',
        bgColor: 'bg-primary',
        textColor: 'text-white',
        order: 0,
        active: true,
        isMain: false,
      })
    }
  }, [banner, open])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await res.json()
      if (data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }))
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = banner
        ? `/api/admin/banners/${banner.id}`
        : '/api/admin/banners'
      const method = banner ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await res.json()
        alert(error.error || 'Erro ao salvar banner')
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      alert('Erro ao salvar banner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {banner ? 'Editar Banner' : 'Novo Banner'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="image">Imagem/GIF</Label>
            <div className="space-y-2">
              {formData.image && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={formData.image}
                    alt="Preview"
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Label
                  htmlFor="image"
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Enviando...' : formData.image ? 'Trocar Imagem' : 'Fazer Upload'}
                </Label>
                {formData.image && (
                  <Input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                    placeholder="Ou cole a URL da imagem"
                    className="flex-1"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="link">Link (opcional)</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bgColor">Cor de Fundo</Label>
              <Input
                id="bgColor"
                value={formData.bgColor}
                onChange={(e) => setFormData((prev) => ({ ...prev, bgColor: e.target.value }))}
                placeholder="bg-primary"
              />
            </div>
            <div>
              <Label htmlFor="textColor">Cor do Texto</Label>
              <Input
                id="textColor"
                value={formData.textColor}
                onChange={(e) => setFormData((prev) => ({ ...prev, textColor: e.target.value }))}
                placeholder="text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="order">Ordem de Exibição</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isMain"
                checked={formData.isMain}
                onChange={(e) => setFormData((prev) => ({ ...prev, isMain: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isMain">Banner Principal (menor, em cima do carrossel)</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
