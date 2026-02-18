'use client'

import { useState, useEffect } from 'react'
import { notFound, useParams } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AddToCartButton } from '@/components/product/add-to-cart-button'
import { FavoriteButton } from '@/components/product/favorite-button'
import { formatPrice, parseImages, parseDetailedDescription, getWhatsAppLink } from '@/lib/utils'
import { ShoppingCart, Share2, Minus, Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import ProductImages from '@/components/product/product-images'

interface Product {
  id: string
  name: string
  slug: string
  sku?: string | null
  description: string | null
  detailedDescription: any
  originalPrice: number | null
  price: number
  stock: number
  weight: number | null
  weightUnit: string | null
  brand: string | null
  productType: string
  images: any
  category: {
    id: string
    name: string
  }
  expirationDate?: string | null
  wholesalePackSize?: number | null
  wholesalePackPrice?: number | null
  sellingMode?: 'UNIT' | 'PACK' | 'BOTH'
  kitItems?: Array<{
    id: string
    product: {
      id: string
      name: string
      description?: string | null
      brand?: string | null
      weight?: number | null
      weightUnit?: string | null
    }
    quantity: number
    unit: string | null
    brand: string | null
    notes: string | null
  }>
}

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [variant, setVariant] = useState<'UNIT' | 'PACK'>('UNIT')

  useEffect(() => {
    if (params.slug) {
      fetch(`/api/products/${params.slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error || !data.active) {
            notFound()
          }
          setProduct(data)
          if (data.sellingMode === 'PACK') {
            setVariant('PACK')
          } else {
            setVariant('UNIT')
          }
          setLoading(false)
        })
        .catch(() => {
          notFound()
        })
    }
  }, [params.slug])

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    notFound()
  }

  const images = parseImages(product.images)
  const detailedDesc = parseDetailedDescription(product.detailedDescription)
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountAmount = hasDiscount ? Number(product.originalPrice) - Number(product.price) : 0
  const discountPercent = hasDiscount
    ? Math.round((discountAmount / Number(product.originalPrice)) * 100)
    : 0

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description || '',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  const handleWhatsAppHelp = () => {
    const message = `Olá, preciso de ajuda com o produto: ${product.name}\n${window.location.href}`
    window.open(getWhatsAppLink('16992025527', message), '_blank')
  }

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary">
              Início
            </Link>
            <span className="mx-2">/</span>
            <Link href="/cestas" className="hover:text-primary">
              Produtos
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/cestas?category=${product.category.id}`} className="hover:text-primary">
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Coluna Esquerda - Imagens */}
            <div>
              <ProductImages images={images} productName={product.name} />
              
              {(product.description || (product.productType === 'KIT' && product.kitItems && product.kitItems.length > 0)) && (
                <Card className="mt-6">
                  <CardContent className="p-4 space-y-4">
                    {product.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Descrição</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    )}

                    {product.productType === 'KIT' && product.kitItems && product.kitItems.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Composição do Kit</h3>
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2 text-[11px] uppercase text-gray-500 font-semibold pb-1 border-b">
                            <span>Unidade</span>
                            <span>Produto</span>
                            <span>Marca</span>
                            <span>Quilo</span>
                          </div>
                          {product.kitItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-4 gap-2 text-sm border-b pb-2">
                              <div className="text-gray-700 font-medium">
                                {item.quantity}x {item.unit || item.product.weightUnit || 'un'}
                              </div>
                              <div>
                                <span className="font-medium">{item.product.name}</span>
                                {item.notes && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {item.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-gray-600">
                                {item.brand || item.product.brand || '-'}
                              </div>
                              <div className="text-gray-600">
                                {item.product.weight
                                  ? `${Number(item.product.weight).toFixed(2)} ${item.product.weightUnit || 'kg'}`
                                  : '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Coluna Direita - Informações e Compra */}
            <div className="space-y-6">
              {/* Título do Produto */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              {product.sku && (
                <div className="text-xs text-gray-500 -mt-3 mb-2">
                  SKU: <span className="font-medium">{product.sku}</span>
                </div>
              )}

              {/* Vendedor */}
              <div className="text-sm text-gray-600 mb-2">
                Vendido por: <span className="font-semibold text-primary">EJG Distribuidora</span>
              </div>

              {/* Marca */}
              {product.brand && (
                <div className="text-sm text-gray-600 mb-2">
                  Marca: <span className="font-semibold">{product.brand}</span>
                </div>
              )}

              {/* Peso */}
              {product.weight && (
                <div className="text-sm text-gray-600 mb-2">
                  Peso: <span className="font-semibold">
                    {Number(product.weight).toFixed(2)} {product.weightUnit || 'kg'}
                  </span>
                </div>
              )}
              
              {/* Validade */}
              {product.expirationDate && (
                <div className="text-sm text-gray-600 mb-2">
                  Validade: <span className="font-semibold">
                    {new Date(product.expirationDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Preço */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                {hasDiscount && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(Number(product.originalPrice))}
                      </span>
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                        {discountPercent}% OFF
                      </span>
                    </div>
                    <p className="text-sm text-green-600 font-semibold">
                      Você economiza {formatPrice(discountAmount)}
                    </p>
                  </div>
                )}
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-primary">
                    {formatPrice(
                      variant === 'PACK' && product.wholesalePackPrice != null
                        ? Number(product.wholesalePackPrice)
                        : Number(product.price)
                    )}
                  </span>
                  <span className="text-sm text-gray-600">
                    {variant === 'PACK' ? 'preço do fardo' : 'à vista'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  ou em até 6x no cartão
                </p>
                {(product.sellingMode === 'PACK' || product.sellingMode === 'BOTH') &&
                  product.wholesalePackSize && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                    <Package className="h-4 w-4" />
                    <span>Fardo com {product.wholesalePackSize} unidades</span>
                  </div>
                )}
                {variant === 'PACK' &&
                  product.wholesalePackSize &&
                  product.wholesalePackPrice != null && (
                  <div className="mt-1 text-xs text-gray-500">
                    Equivale a{' '}
                    {formatPrice(
                      Number(product.wholesalePackPrice) / Number(product.wholesalePackSize)
                    )}{' '}
                    por unidade no fardo
                  </div>
                )}
                {product.sellingMode === 'BOTH' && product.wholesalePackSize && product.wholesalePackPrice != null && (
                  <div className="mt-3 text-sm text-gray-700">
                    Opções:
                    <div className="mt-2 flex gap-2">
                      <button
                        className={`px-3 py-1 rounded border ${
                          variant === 'UNIT' ? 'bg-primary text-white border-primary' : 'bg-white'
                        }`}
                        onClick={() => setVariant('UNIT')}
                      >
                        Unidade
                      </button>
                      <button
                        className={`px-3 py-1 rounded border ${
                          variant === 'PACK' ? 'bg-primary text-white border-primary' : 'bg-white'
                        }`}
                        onClick={() => setVariant('PACK')}
                      >
                        Fardo ({product.wholesalePackSize} un)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantidade e Botões */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>Estoque disponível: {product.stock}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price:
                        variant === 'PACK' && product.wholesalePackPrice != null
                          ? Number(product.wholesalePackPrice)
                          : Number(product.price),
                      image: images[0],
                      variant,
                      packSize:
                        variant === 'PACK' ? (product.wholesalePackSize || undefined) : undefined,
                    }}
                    quantity={quantity}
                    className="flex-1 h-12 text-lg"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <FavoriteButton
                      product={{
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: Number(product.price),
                        image: images[0],
                      }}
                    />
                    <span className="text-sm">Favoritar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">Compartilhar</span>
                  </Button>
                </div>

                <Button
                  className="w-full h-12 text-base font-semibold gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleWhatsAppHelp}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white" aria-hidden="true">
                      <path d="M16.02 4.6c-6.27 0-11.37 5.1-11.37 11.37 0 2.01.53 3.98 1.54 5.71L4 28l6.5-2.12a11.3 11.3 0 0 0 5.52 1.42h.01c6.27 0 11.37-5.1 11.37-11.37S22.29 4.6 16.02 4.6zm0 20.64h-.01c-1.75 0-3.46-.48-4.95-1.38l-.36-.21-3.86 1.26 1.26-3.76-.24-.39a9.17 9.17 0 0 1-1.43-4.9c0-5.07 4.12-9.2 9.2-9.2 5.07 0 9.2 4.12 9.2 9.2 0 5.07-4.12 9.2-9.2 9.2zm5.33-6.86c-.29-.14-1.73-.85-2-1-.27-.14-.46-.21-.66.21-.2.41-.76 1-1 1.21-.18.21-.37.24-.66.07-.29-.14-1.23-.45-2.34-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.14-.14.29-.37.44-.55.14-.17.21-.29.31-.48.1-.2.04-.37-.02-.52-.07-.14-.66-1.58-.9-2.17-.24-.57-.49-.49-.66-.49-.17 0-.36-.01-.55-.01-.2 0-.52.07-.8.37-.27.29-1.05 1.02-1.05 2.49s1.07 2.88 1.21 3.08c.14.2 2.1 3.2 5.07 4.48.71.31 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.57-.34z" />
                    </svg>
                  </span>
                  Precisa de ajuda? Fale no WhatsApp
                </Button>
              </div>
            </div>
          </div>

          {/* Descrição Detalhada (Tabela) */}
          {detailedDesc.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Descrição do Produto</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Quantidade
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Produto
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Marca
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Tamanho/Unidade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedDesc.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-3">{item.name}</td>
                        <td className="border border-gray-300 px-4 py-3">{item.brand || '-'}</td>
                        <td className="border border-gray-300 px-4 py-3">{item.unit || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {product.weight && (
                  <div className="mt-4 text-right">
                    <p className="text-sm font-semibold">
                      Peso: {Number(product.weight).toFixed(2)} {product.weightUnit || 'kg'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
