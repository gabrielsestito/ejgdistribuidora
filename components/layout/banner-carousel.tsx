'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

interface Banner {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  image?: string | null
  link?: string | null
  bgColor: string
  textColor: string
}

interface BannerCarouselProps {
  banners?: Banner[]
}

export function BannerCarousel({ banners: propBanners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(!propBanners)

  useEffect(() => {
    if (propBanners) {
      setBanners(propBanners)
      setLoading(false)
    } else {
      fetch('/api/banners')
        .then((res) => res.json())
        .then((data) => {
          setBanners(data)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [propBanners])

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
      }, 5000) // Muda a cada 5 segundos

      return () => clearInterval(interval)
    }
  }, [banners.length])

  if (loading) {
    return (
      <div className="relative w-full py-1 sm:py-3">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="h-[160px] sm:h-[240px] md:h-[340px] bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  return (
    <div className="relative w-full py-1 sm:py-3">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="relative overflow-hidden rounded-lg h-[160px] sm:h-[220px] md:h-[320px] max-h-[380px]">
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="min-w-full flex-shrink-0 h-full relative"
              >
                {banner.link ? (
                  <Link href={banner.link} className="block h-full">
                    <BannerContent banner={banner} />
                  </Link>
                ) : (
                  <BannerContent banner={banner} />
                )}
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 shadow-lg z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 shadow-lg z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* Dots Indicator */}
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={cn(
                      'h-1.5 sm:h-2 rounded-full transition-all',
                      index === currentIndex
                        ? 'bg-white w-6 sm:w-8'
                        : 'bg-white/50 hover:bg-white/75 w-1.5 sm:w-2'
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function BannerContent({ banner }: { banner: Banner }) {
  const isGif = banner.image?.endsWith('.gif') || banner.image?.includes('.gif')

  // Se tiver imagem, mostra apenas a imagem
  if (banner.image) {
    return (
      <div className="relative w-full h-full">
        {isGif ? (
          <img
            src={banner.image}
            alt={banner.title || 'Banner'}
            className="w-full h-full object-cover md:object-contain rounded-lg"
          />
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={banner.image}
              alt={banner.title || 'Banner'}
              fill
              className="object-cover md:object-contain rounded-lg"
              sizes="100vw"
              priority
            />
          </div>
        )}
      </div>
    )
  }

  // Se não tiver imagem, mostra o conteúdo com texto (fallback)
  return (
    <div className={cn('relative flex items-center justify-between gap-8 px-6 md:px-8 py-6 md:py-8 h-full', banner.bgColor)}>
      <div className={cn('flex-1 z-10', banner.textColor)}>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="text-base md:text-lg lg:text-xl mb-2 opacity-90">
            {banner.subtitle}
          </p>
        )}
        {banner.description && (
          <p className="text-xs md:text-sm lg:text-base opacity-80 max-w-2xl">
            {banner.description}
          </p>
        )}
      </div>
    </div>
  )
}
