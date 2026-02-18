import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product/product-card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { parseImages } from '@/lib/utils'

interface SearchParams {
  category?: string
  sort?: string
  search?: string
}

export default async function CestasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { category, sort, search } = searchParams

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })

  let where: any = { active: true }
  if (category) {
    where.categoryId = category
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ]
  }

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'price-asc') {
    orderBy = { price: 'asc' }
  } else if (sort === 'price-desc') {
    orderBy = { price: 'desc' }
  } else if (sort === 'name') {
    orderBy = { name: 'asc' }
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy,
  })

  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Nossas Cestas</h1>
            <p className="text-gray-600">
              Escolha a cesta ideal para sua família
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar cestas..."
                className="pl-10"
                defaultValue={search}
                name="search"
              />
            </div>
            <Select name="category" defaultValue={category}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="sort" defaultValue={sort}>
              <SelectTrigger className="w-full md:w-[200px]">
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

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhuma cesta encontrada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const images = parseImages(product.images)
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={Number(product.price)}
                    originalPrice={product.originalPrice ? Number(product.originalPrice) : null}
                    image={images[0]}
                    description={product.description || undefined}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
