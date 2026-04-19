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
    variantId?: string
    variantName?: string
    packSize?: number
  }
  quantity?: number
  className?: string
  disabled?: boolean
}

export function AddToCartButton({ 
  product, 
  quantity = 1, 
  className,
  disabled 
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      onClick={handleAdd}
      className={className}
      variant={added ? 'secondary' : 'default'}
      size="default"
      disabled={disabled}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {added ? 'Adicionado!' : 'Adicionar'}
    </Button>
  )
}
