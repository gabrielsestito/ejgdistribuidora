'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, X, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCart } from '@/contexts/cart-context'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, total, itemCount } = useCart()
  const [minOrder, setMinOrder] = useState<number>(50)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        if (typeof data?.minOrderAmount === 'number') {
          setMinOrder(data.minOrderAmount)
        }
      } catch {
        // fallback 50
      }
    }
    loadConfig()
  }, [])

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center py-12">
              <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
              <p className="text-gray-600 mb-8">
                Adicione produtos ao carrinho para continuar.
              </p>
              <Button asChild size="lg">
                <Link href="/cestas">Ver Cestas</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Carrinho</h1>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      {item.image && (
                        <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Link href={`/cestas/${item.slug}`}>
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        {item.variant === 'PACK' && item.packSize && (
                          <p className="text-xs text-gray-500">Fardo ({item.packSize} un)</p>
                        )}
                        <p className="text-primary font-semibold mt-1">
                          {formatPrice(item.price)}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="md:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frete</span>
                      <span className="text-gray-500">Calculado no checkout</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                    </div>
                    {total < minOrder && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">
                          Pedido mínimo é R$ {minOrder.toFixed(2)}. Adicione mais itens para continuar.
                        </p>
                      </div>
                    )}
                  </div>
                  {total < minOrder ? (
                    <Button className="w-full" size="lg" disabled>
                      Finalizar Compra
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button asChild className="w-full" size="lg">
                      <Link href="/checkout">
                        Finalizar Compra
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full mt-2"
                  >
                    <Link href="/cestas">Continuar Comprando</Link>
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
