'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/contexts/favorites-context'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    image?: string
  }
  className?: string
}

export function FavoriteButton({ product, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(product.id)

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => toggleFavorite(product)}
      className={cn(
        'transition-all hover:scale-110',
        favorite && 'bg-primary/10 border-primary',
        className
      )}
      title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          favorite ? 'fill-primary text-primary' : 'text-gray-600'
        )}
      />
    </Button>
  )
}
