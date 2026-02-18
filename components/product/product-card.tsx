'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Heart, ShieldCheck, Truck } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { useFavorites } from '@/contexts/favorites-context'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number | null
  image?: string
  description?: string
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  originalPrice,
  image,
  description,
}: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()

  const favorite = isFavorite(id)
  const hasDiscount = originalPrice && originalPrice > price
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite({
      id,
      name,
      slug,
      price,
      image,
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-200 group relative flex flex-col h-full border-gray-100">
      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute top-2 right-2 z-10 bg-white/80 hover:bg-white shadow-md transition-all',
          favorite && 'bg-primary/10'
        )}
        onClick={handleToggleFavorite}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-colors',
            favorite ? 'fill-primary text-primary' : 'text-gray-600'
          )}
        />
      </Button>

      <Link href={`/cestas/${slug}`} className="flex-shrink-0">
        <div className="relative aspect-square w-full bg-gray-100">
          {hasDiscount && (
            <div className="absolute top-2 left-2 z-10 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
              {discountPercent}% OFF
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <Link href={`/cestas/${slug}`}>
          <h3 className="font-semibold text-base md:text-lg hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
        </Link>
        {description && (
          <p className="text-sm text-gray-600 line-clamp-1 mt-1">
            {description}
          </p>
        )}
        <div className="mt-auto pt-3 space-y-2">
          {hasDiscount && (
            <div className="text-xs text-gray-500 line-through">
              {formatPrice(originalPrice as number)}
            </div>
          )}
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xl font-bold text-primary">
              {formatPrice(price)}
            </p>
            {hasDiscount && (
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                Economize {formatPrice((originalPrice as number) - price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              Compra segura
            </span>
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-primary" />
              Entrega rápida
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button asChild className="w-full h-10 text-sm font-semibold">
          <Link href={`/cestas/${slug}`}>Ver produto</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
