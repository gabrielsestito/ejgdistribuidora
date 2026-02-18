'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Plus, Minus, ShoppingBag, Trash2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart()

  const shipping = 0 // Será calculado no checkout baseado no CEP
  const finalTotal = total + shipping
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
        // fallback já é 50
      }
    }
    loadConfig()
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Carrinho de Compras</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h3>
              <p className="text-gray-500 mb-6 text-center">
                Adicione produtos ao carrinho para continuar comprando
              </p>
              <Button asChild size="lg" onClick={() => onOpenChange(false)}>
                <Link href="/cestas">Ver Produtos</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                  >
                    {item.image ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base mb-1 truncate">{item.name}</h4>
                      {item.variant === 'PACK' && item.packSize && (
                        <p className="text-xs text-gray-500">Fardo ({item.packSize} un)</p>
                      )}
                      <p className="text-primary font-bold text-lg mb-2">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo */}
              <div className="mt-6 pt-6 border-t bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                  </span>
                  <span className="font-semibold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span className="font-semibold text-gray-500">
                    Calculado no checkout
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-xl font-bold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(finalTotal)}
                  </span>
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
            </>
          )}
        </div>
        {items.length > 0 && (
          <div className="mt-6 pt-4 border-t space-y-3">
            {total < minOrder ? (
              <Button className="w-full" size="lg" disabled>
                Finalizar Compra
              </Button>
            ) : (
              <Button asChild className="w-full" size="lg" onClick={() => onOpenChange(false)}>
                <Link href="/checkout">
                  Finalizar Compra
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Continuar Comprando
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
