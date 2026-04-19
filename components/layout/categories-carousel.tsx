'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  _count: {
    products: number
  }
}

interface CategoriesCarouselProps {
  categories: Category[]
}

export function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      return () => container.removeEventListener('scroll', checkScroll)
    }
  }, [categories])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      const newScrollLeft =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
    }
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canScrollLeft}
          className="h-8 w-8 rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm hover:bg-blue-50 disabled:opacity-40"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canScrollRight}
          className="h-8 w-8 rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm hover:bg-blue-50 disabled:opacity-40"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Container de Categorias */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/cestas?category=${category.id}`}
            className="flex-shrink-0 w-28 sm:w-32 md:w-36 group"
          >
            <div className="flex flex-col items-center gap-2.5">
              <div className="relative w-24 h-20 md:w-28 md:h-24 rounded-2xl overflow-hidden border border-blue-100 bg-[#EAF3FF] shadow-sm group-hover:shadow-md transition-all">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-2xl">📦</span>
                  </div>
                )}
              </div>
              <span className="text-xs md:text-sm text-center text-gray-800 group-hover:text-blue-700 transition-colors font-semibold line-clamp-2">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
