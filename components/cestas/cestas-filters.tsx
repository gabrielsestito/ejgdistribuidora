'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  subcategories?: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface CestasFiltersProps {
  categories: Category[]
  initialCategory?: string
  initialSort?: string
  initialSearch?: string
  sub?: string
  children?: ReactNode
}

export function CestasFilters({
  categories,
  initialCategory = 'all',
  initialSort = 'newest',
  initialSearch = '',
  sub,
  children,
}: CestasFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState(initialSort)
  const [search, setSearch] = useState(initialSearch)
  const [selectedSub, setSelectedSub] = useState(sub || '')
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(
    initialCategory && initialCategory !== 'all' ? initialCategory : null
  )

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === category),
    [categories, category]
  )

  const push = (next: {
    category?: string
    sort?: string
    search?: string
    sub?: string | null
  }) => {
    const params = new URLSearchParams()
    const c = next.category ?? category
    const s = next.sort ?? sort
    const q = next.search ?? search
    const selectedSubValue = next.sub === null ? '' : (next.sub ?? selectedSub)
    if (c && c !== 'all') params.set('category', c)
    if (s && s !== 'newest') params.set('sort', s)
    if (q && q.trim() !== '') params.set('search', q.trim())
    if (selectedSubValue) params.set('sub', selectedSubValue)
    const qs = params.toString()
    router.push(qs ? `/cestas?${qs}` : '/cestas')
    const target = document.getElementById('products-grid')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    setCategory(searchParams.get('category') || 'all')
    setSort(searchParams.get('sort') || 'newest')
    setSearch(searchParams.get('search') || '')
    setSelectedSub(searchParams.get('sub') || '')
  }, [searchParams])

  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <aside className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm h-fit">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filtros</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setCategory('all')
              setSelectedSub('')
              push({ category: 'all', sub: null })
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Limpar
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categoria</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('all')
                  setSelectedSub('')
                  setOpenCategoryId(null)
                  push({ category: 'all', sub: null })
                }}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-all',
                  category === 'all'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                Todas categorias
              </button>
              {categories.map((cat) => (
                <div key={cat.id} className="rounded-lg border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = openCategoryId === cat.id ? null : cat.id
                      setOpenCategoryId(nextOpen)
                      setCategory(cat.id)
                      const subcategoryBelongs = cat.subcategories?.some((item) => item.slug === selectedSub)
                      if (!subcategoryBelongs) {
                        setSelectedSub('')
                        push({ category: cat.id, sub: null })
                        return
                      }
                      push({ category: cat.id })
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    <span className={cn(category === cat.id && 'font-semibold text-primary')}>{cat.name}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-gray-400 transition-transform',
                        openCategoryId === cat.id && 'rotate-180 text-primary'
                      )}
                    />
                  </button>
                  {openCategoryId === cat.id && cat.subcategories && cat.subcategories.length > 0 ? (
                    <div className="px-3 pb-3 flex flex-wrap gap-2">
                      {cat.subcategories.map((subcat) => (
                        <button
                          key={subcat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id)
                            setSelectedSub(subcat.slug)
                            push({ category: cat.id, sub: subcat.slug })
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs transition-all',
                            selectedSub === subcat.slug
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 text-gray-700 hover:border-primary/50 hover:bg-primary/5'
                          )}
                        >
                          {subcat.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cestas..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    push({ search: (e.target as HTMLInputElement).value })
                  }
                }}
              />
            </div>
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value)
                push({ sort: value })
              }}
            >
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ativos:</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {selectedCategory?.name || 'Todas categorias'}
          </span>
          {selectedSub ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {selectedCategory?.subcategories?.find((item) => item.slug === selectedSub)?.name || selectedSub}
            </span>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}
