'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, X, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ProductFormProps {
  product?: {
    id: string
    name: string
    slug: string
    description: string | null
    originalPrice: any
    price: any
    stock: number
    weight: any
    weightUnit: string | null
    brand: string | null
    productType: string
    active: boolean
    categoryId: string
    images: string[]
    detailedDescription?: any
    expirationDate?: string | null
    wholesalePackSize?: number | null
    wholesalePackPrice?: number | null
    kitItems?: Array<{
      id: string
      productId: string
      quantity: number
      unit: string | null
      brand: string | null
      notes: string | null
    }>
  }
}

interface KitItem {
  productId: string
  quantity: number
  unit: string
  brand: string
  notes: string
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [products, setProducts] = useState<{
    id: string
    name: string
    brand: string | null
    weight: any
    weightUnit: string | null
  }[]>([])
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [kitItems, setKitItems] = useState<KitItem[]>(
    product?.kitItems?.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit || 'un',
      brand: item.brand || '',
      notes: item.notes || '',
    })) || []
  )
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: (product as any)?.sku || '',
    description: product?.description || '',
    originalPrice: product?.originalPrice ? String(product.originalPrice) : '',
    price: product?.price ? String(product.price) : '',
    stock: product?.stock || 0,
    weight: product?.weight ? String(product.weight) : '',
    weightUnit: product?.weightUnit || 'kg',
    brand: product?.brand || '',
    productType: product?.productType || 'NORMAL',
    categoryId: product?.categoryId || '',
    active: product?.active ?? true,
    featured: (product as any)?.featured ?? false,
    expirationDate: product?.expirationDate
      ? new Date(product.expirationDate).toISOString().slice(0, 10)
      : '',
    wholesalePackSize: (product as any)?.wholesalePackSize ? String((product as any).wholesalePackSize) : '',
    wholesalePackPrice: (product as any)?.wholesalePackPrice ? String((product as any).wholesalePackPrice) : '',
    sellingMode: (product as any)?.sellingMode || 'UNIT',
  })

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error)

    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.filter((p: any) => p.id !== product?.id && p.productType === 'NORMAL')))
      .catch(console.error)
  }, [product?.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'products')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await res.json()
      if (data.url) {
        setImages((prev) => [...prev, data.url])
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addKitItem = () => {
    setKitItems((prev) => [
      ...prev,
      {
        productId: '',
        quantity: 1,
        unit: 'un',
        brand: '',
        notes: '',
      },
    ])
  }

  const removeKitItem = (index: number) => {
    setKitItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateKitItem = (index: number, field: keyof KitItem, value: any) => {
    setKitItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const handleKitProductChange = (index: number, productId: string) => {
    const selectedProduct = products.find((prod) => prod.id === productId)
    setKitItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        return {
          ...item,
          productId,
          unit: selectedProduct?.weightUnit || item.unit || 'un',
          brand: selectedProduct?.brand || item.brand || '',
        }
      })
    )
  }

  const getProductInfo = (productId: string) => products.find((prod) => prod.id === productId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stock: Number(formData.stock),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: JSON.stringify(images),
        featured: formData.featured,
      }
      if (!payload.expirationDate) {
        payload.expirationDate = null
      }
      payload.wholesalePackSize = formData.wholesalePackSize ? Number(formData.wholesalePackSize) : null
      payload.wholesalePackPrice = formData.wholesalePackPrice ? parseFloat(formData.wholesalePackPrice) : null
      payload.sellingMode = formData.sellingMode
      if (!payload.sku) {
        delete payload.sku
      }

      // Se for KIT, incluir itens do kit
      if (formData.productType === 'KIT') {
        payload.kitItems = kitItems
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'un',
            brand: item.brand || null,
            notes: item.notes || null,
          }))
      }

      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = product ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/admin/produtos')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Erro ao salvar produto')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Erro ao salvar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/produtos">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-gray-200 bg-white/80 shadow-sm hover:shadow-md">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {product ? 'Editar Produto' : 'Novo Produto'}
              </h1>
              <p className="text-gray-600 mt-1">
                {product ? 'Atualize as informações do produto' : 'Preencha os dados para criar um novo produto'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-white/80 p-2 rounded-2xl border border-gray-200/70 shadow-sm">
              <TabsTrigger
                value="basic"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                Preços
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                Imagens
              </TabsTrigger>
              <TabsTrigger
                value="stock"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                Estoque
              </TabsTrigger>
              <TabsTrigger
                value="kit"
                disabled={formData.productType !== 'KIT'}
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                Kit/Cesta
              </TabsTrigger>
            </TabsList>

            {/* Dados Básicos */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <Card className="border-gray-200/80 shadow-sm rounded-2xl bg-white/90">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-primary/5 via-white to-transparent rounded-t-2xl">
                  <CardTitle className="text-lg font-semibold">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                      Nome do Produto *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Ex: Ketchup Tradicional Heinz - 397g"
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
                      placeholder="Descreva o produto..."
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand" className="text-sm font-medium text-gray-700 mb-2 block">
                        Marca
                      </Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                        placeholder="Ex: Heinz"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sku" className="text-sm font-medium text-gray-700 mb-2 block">
                        SKU
                      </Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                        placeholder="Ex: EJG-HEINZ-397G"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="productType" className="text-sm font-medium text-gray-700 mb-2 block">
                        Tipo do Produto *
                      </Label>
                      <Select
                        value={formData.productType}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, productType: value }))}
                        required
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NORMAL">Produto Normal</SelectItem>
                          <SelectItem value="KIT">Kit/Cesta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expirationDate" className="text-sm font-medium text-gray-700 mb-2 block">
                      Data de Validade
                    </Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight" className="text-sm font-medium text-gray-700 mb-2 block">
                        Peso
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="weightUnit" className="text-sm font-medium text-gray-700 mb-2 block">
                        Unidade
                      </Label>
                      <Select
                        value={formData.weightUnit}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, weightUnit: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Gramas (g)</SelectItem>
                          <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                          <SelectItem value="ml">Mililitros (ml)</SelectItem>
                          <SelectItem value="l">Litros (l)</SelectItem>
                          <SelectItem value="un">Unidade (un)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="categoryId" className="text-sm font-medium text-gray-700 mb-2 block">
                      Categoria *
                    </Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        Produto ativo
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="featured" className="cursor-pointer text-sm font-medium text-gray-700">
                        Destaque do dia
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preços */}
            <TabsContent value="pricing" className="space-y-6 mt-6">
              <Card className="border-gray-200/80 shadow-sm rounded-2xl bg-white/90">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-primary/5 via-white to-transparent rounded-t-2xl">
                  <CardTitle className="text-lg font-semibold">Preços e Ofertas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <Label htmlFor="sellingMode" className="text-sm font-medium text-gray-700 mb-2 block">
                      Modo de Venda
                    </Label>
                    <Select
                      value={formData.sellingMode}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, sellingMode: value }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNIT">Unidade</SelectItem>
                        <SelectItem value="PACK">Fardo</SelectItem>
                        <SelectItem value="BOTH">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="originalPrice" className="text-sm font-medium text-gray-700 mb-2 block">
                      Preço Original (De)
                    </Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, originalPrice: e.target.value }))}
                      placeholder="0.00"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Deixe vazio se não houver desconto
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700 mb-2 block">
                      Preço de Venda (Por) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      required
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wholesalePackSize" className="text-sm font-medium text-gray-700 mb-2 block">
                        Quantidade por Fardo (Atacado)
                      </Label>
                      <Input
                        id="wholesalePackSize"
                        type="number"
                        min="1"
                        value={formData.wholesalePackSize}
                        onChange={(e) => setFormData((prev) => ({ ...prev, wholesalePackSize: e.target.value }))}
                        placeholder="Ex: 12"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wholesalePackPrice" className="text-sm font-medium text-gray-700 mb-2 block">
                        Preço do Fardo
                      </Label>
                      <Input
                        id="wholesalePackPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.wholesalePackPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, wholesalePackPrice: e.target.value }))}
                        placeholder="0.00"
                        className="h-11"
                      />
                    </div>
                  </div>
                  {formData.originalPrice && parseFloat(formData.originalPrice) > parseFloat(formData.price) && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                      <p className="text-sm font-semibold text-green-800">
                        Desconto: {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)}% OFF
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Economia: R$ {(parseFloat(formData.originalPrice) - parseFloat(formData.price)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Imagens */}
            <TabsContent value="images" className="space-y-6 mt-6">
              <Card className="border-gray-200/80 shadow-sm rounded-2xl bg-white/90">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-primary/5 via-white to-transparent rounded-t-2xl">
                  <CardTitle className="text-lg font-semibold">Imagens do Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-gray-300 rounded-2xl bg-white/70 hover:border-primary hover:bg-primary/5 transition-all">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">
                          {uploading ? 'Enviando...' : 'Clique para adicionar imagem'}
                        </span>
                      </div>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*,.gif"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors">
                            {image.endsWith('.gif') || image.includes('.gif') ? (
                              <img
                                src={image}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Image
                                src={image}
                                alt={`Imagem ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded shadow">
                              Principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Estoque */}
            <TabsContent value="stock" className="space-y-6 mt-6">
              <Card className="border-gray-200/80 shadow-sm rounded-2xl bg-white/90">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-primary/5 via-white to-transparent rounded-t-2xl">
                  <CardTitle className="text-lg font-semibold">Controle de Estoque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700 mb-2 block">
                      Quantidade em Estoque *
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      required
                      className="h-11"
                    />
                  </div>
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    O estoque será atualizado automaticamente quando houver pedidos.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Kit/Cesta */}
            {formData.productType === 'KIT' && (
              <TabsContent value="kit" className="space-y-6 mt-6">
                <Card className="border-gray-200/80 shadow-sm rounded-2xl bg-white/90">
                  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-primary/5 via-white to-transparent rounded-t-2xl">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold">Composição do Kit/Cesta</CardTitle>
                      <Button type="button" onClick={addKitItem} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {kitItems.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gradient-to-r from-primary/5 via-white to-transparent">
                        <p className="text-gray-600 mb-2">Nenhum item adicionado ao kit</p>
                        <p className="text-sm text-gray-500">Clique em "Adicionar Item" para começar</p>
                      </div>
                    ) : (
                      kitItems.map((item, index) => (
                        <div key={index} className="p-5 border border-gray-200/80 rounded-2xl space-y-4 bg-white/80 shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-900">Item {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeKitItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Produto *</Label>
                              <Select
                                value={item.productId}
                                onValueChange={(value) => handleKitProductChange(index, value)}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((prod) => (
                                    <SelectItem key={prod.id} value={prod.id}>
                                      {prod.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {item.productId && (
                                <div className="mt-2 text-xs text-gray-500">
                                  {(() => {
                                    const info = getProductInfo(item.productId)
                                    if (!info) return null
                                    const weightLabel = info.weight ? `${info.weight} ${info.weightUnit || ''}`.trim() : 'não informado'
                                    return (
                                      <span>
                                        Marca: {info.brand || 'não informada'} · Peso: {weightLabel}
                                      </span>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Quantidade *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateKitItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="h-11"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Unidade</Label>
                              <Select
                                value={item.unit}
                                onValueChange={(value) => updateKitItem(index, 'unit', value)}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="g">g</SelectItem>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="ml">ml</SelectItem>
                                  <SelectItem value="l">l</SelectItem>
                                  <SelectItem value="un">un</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Marca</Label>
                              <Input
                                value={item.brand}
                                onChange={(e) => updateKitItem(index, 'brand', e.target.value)}
                                placeholder="Opcional"
                                className="h-11"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">Observações</Label>
                              <Textarea
                                value={item.notes}
                                onChange={(e) => updateKitItem(index, 'notes', e.target.value)}
                                rows={2}
                                placeholder="Observações sobre este item (opcional)"
                                className="resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200/70">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-11 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-11 w-full sm:w-auto min-w-[140px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Produto'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
