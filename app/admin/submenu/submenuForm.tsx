'use client'

import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'

export default function SubmenuForm({ defaultOrder }: { defaultOrder: number }) {
  const [label, setLabel] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [link, setLink] = useState('')
  const [order, setOrder] = useState<number>(defaultOrder || 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'submenu')
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Erro ao enviar logo')
      }
      setIconUrl(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/nav-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, iconUrl, link, order }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Falha ao salvar')
      }
      location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-3">
        <Label>Logo</Label>
        {iconUrl ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden border bg-white">
                <Image src={iconUrl} alt="Logo" width={48} height={48} className="object-cover" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">Logo selecionada</p>
                <p className="text-gray-500">PNG ou JPG</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIconUrl('')}>
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Trocar
              </Button>
              <input
                ref={fileInputRef}
                id="iconFile"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-100" />
              <div>
                <p className="text-sm font-medium">Envie uma imagem</p>
                <p className="text-xs text-gray-500">PNG/JPG quadrado funciona melhor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                id="iconFile"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </div>
          </div>
        )}
      </div>
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="label">Texto</Label>
          <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="Ex.: Promoções" />
        </div>
        <div>
          <Label htmlFor="order">Ordem</Label>
          <Input id="order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="link">Link de destino</Label>
          <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} required placeholder="/promocoes" />
        </div>
        <div className="md:col-span-2 flex items-center justify-between mt-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving || uploading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
