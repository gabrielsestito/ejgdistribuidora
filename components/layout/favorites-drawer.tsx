'use client'

import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/contexts/favorites-context'
import { useCart } from '@/contexts/cart-context'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface FavoritesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FavoritesDrawer({ open, onOpenChange }: FavoritesDrawerProps) {
  const { favorites, removeFavorite, toggleFavorite } = useFavorites()
  const { addItem } = useCart()

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            Meus Favoritos
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({favorites.length})
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum favorito ainda</h3>
              <p className="text-gray-600 mb-6">
                Adicione produtos aos favoritos para encontrá-los facilmente depois.
              </p>
              <Button asChild onClick={() => onOpenChange(false)}>
                <Link href="/cestas">Ver Produtos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  {item.image && (
                    <Link
                      href={`/cestas/${item.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/cestas/${item.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="block"
                    >
                      <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-primary font-bold mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        className="flex-1"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFavorite(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
