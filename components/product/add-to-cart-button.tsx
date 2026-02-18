'use client'

import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    image?: string
    variant?: 'UNIT' | 'PACK'
    packSize?: number
  }
  quantity?: number
  className?: string
}

export function AddToCartButton({ product, quantity = 1, className }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      onClick={handleAdd}
      className={className}
      variant={added ? 'secondary' : 'default'}
      size="default"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {added ? 'Adicionado!' : 'Adicionar'}
    </Button>
  )
}
