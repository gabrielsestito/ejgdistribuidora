'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductImagesProps {
  images: string[]
  productName: string
}

export default function ProductImages({ images, productName }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-sm">Sem imagem</p>
          </div>
        </div>
      </div>
    )
  }

  const mainImage = images[selectedIndex] || images[0]

  return (
    <div className="space-y-4">
      {/* Imagem Principal */}
      <div className="relative aspect-square w-full bg-white rounded-lg overflow-hidden border border-gray-200">
        {mainImage.endsWith('.gif') || mainImage.includes('.gif') ? (
          <img
            src={mainImage}
            alt={productName}
            className="w-full h-full object-contain"
          />
        ) : (
          <Image
            src={mainImage}
            alt={productName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        )}

        {/* Navegação de Imagens */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md z-10"
              onClick={() => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md z-10"
              onClick={() => setSelectedIndex((prev) => (prev + 1) % images.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative aspect-square w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-primary/50'
              )}
            >
              {image.endsWith('.gif') || image.includes('.gif') ? (
                <img
                  src={image}
                  alt={`${productName} - Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={image}
                  alt={`${productName} - Imagem ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
