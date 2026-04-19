'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronRight, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface DepartmentMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  _count: {
    products: number
  }
  subcategories?: Array<{
    id: string
    name: string
    slug: string
    iconUrl?: string | null
    order: number
  }>
}

export function DepartmentMenu({ open, onOpenChange }: DepartmentMenuProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      fetch('/api/categories?menu=true')
        .then((res) => res.json())
        .then((data) => {
          setCategories(data)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-2 w-[min(100vw-2rem,26rem)] bg-white/95 rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[70vh] overflow-y-auto backdrop-blur"
      style={{
        top: '100%',
        animation: 'slideDown 0.2s ease-out'
      }}
    >
      <div className="p-4">
        <div className="mb-3 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Departamentos
          </h3>
          <span className="text-[11px] text-gray-500">Atualizado ao vivo</span>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-white to-transparent p-3 mb-4">
          <p className="text-xs text-gray-600">
            Encontre suas categorias favoritas com ofertas e novidades.
          </p>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhuma categoria disponível</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-transparent bg-white/80 hover:bg-primary/5 hover:border-primary/20 transition-all group shadow-sm">
                <button
                  type="button"
                  className="w-full flex items-center gap-4 px-4 py-3"
                  onClick={() => setOpenCategoryId((prev) => (prev === category.id ? null : category.id))}
                >
                  {category.image ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-200"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <span className="font-medium text-gray-900 block truncate group-hover:text-primary transition-colors">
                      {category.name}
                    </span>
                    {category._count.products > 0 && (
                      <span className="text-xs text-gray-500">
                        {category._count.products} {category._count.products === 1 ? 'produto' : 'produtos'}
                      </span>
                    )}
                  </div>
                  <ChevronRight className={cn(
                    'h-4 w-4 text-gray-400 transition-all flex-shrink-0',
                    openCategoryId === category.id ? 'text-primary rotate-90' : 'group-hover:text-primary group-hover:translate-x-1'
                  )} />
                </button>
                {openCategoryId === category.id && (
                  <div className="px-4 pb-3">
                    {category.subcategories && category.subcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/cestas?category=${category.id}&sub=${sub.slug}`}
                            onClick={() => onOpenChange(false)}
                            className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-primary/5 hover:border-primary/30 text-gray-700 inline-flex items-center gap-2"
                          >
                            {sub.iconUrl ? (
                              <Image src={sub.iconUrl} alt={sub.name} width={14} height={14} className="rounded" />
                            ) : null}
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/cestas?category=${category.id}`}
                          onClick={() => onOpenChange(false)}
                          className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-primary/5 hover:border-primary/30 text-gray-700"
                        >
                          Todos
                        </Link>
                        <Link
                          href={`/cestas?category=${category.id}&sub=pack`}
                          onClick={() => onOpenChange(false)}
                          className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-primary/5 hover:border-primary/30 text-gray-700"
                        >
                          Fardo
                        </Link>
                        <Link
                          href={`/cestas?category=${category.id}&sub=unit`}
                          onClick={() => onOpenChange(false)}
                          className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-primary/5 hover:border-primary/30 text-gray-700"
                        >
                          Unidade
                        </Link>
                        <Link
                          href={`/cestas?category=${category.id}&sub=kit`}
                          onClick={() => onOpenChange(false)}
                          className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-primary/5 hover:border-primary/30 text-gray-700"
                        >
                          Kits
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/cestas"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 py-3 text-xs font-semibold text-primary hover:bg-primary/5 transition-all"
            >
              Ver todas as categorias
            </Link>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
