import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product/product-card'
import { parseImages } from '@/lib/utils'
import { CestasFilters } from '@/components/cestas/cestas-filters'

export const dynamic = 'force-dynamic'

interface SearchParams {
  category?: string
  sort?: string
  search?: string
  sub?: string
}

export default async function CestasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { category, sort, search, sub } = searchParams

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: {
      subcategories: {
        where: { active: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  let where: any = { active: true }
  if (category && category !== 'all') {
    where.categoryId = category
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ]
  }

  if (sub) {
    const subcat = await (prisma as any).subcategory.findUnique({
      where: { slug: sub },
      select: { id: true, categoryId: true },
    })
    if (subcat) {
      where.subcategoryId = subcat.id
      if (!category || category === 'all') {
        where.categoryId = subcat.categoryId
      }
    }
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

          <CestasFilters
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              subcategories: c.subcategories,
            }))}
            initialCategory={category || 'all'}
            initialSort={sort || 'newest'}
            initialSearch={search || ''}
            sub={sub}
          >
            {products.length === 0 ? (
              <div id="products-grid" className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Nenhuma cesta encontrada.
                </p>
              </div>
            ) : (
              <div
                id="products-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {products.map((product) => {
                  const images = parseImages(product.images)
                  const displayPrice = Number(product.price)
                  const displayOriginalPrice = product.originalPrice ? Number(product.originalPrice) : null
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      price={displayPrice}
                      originalPrice={displayOriginalPrice}
                      image={images[0]}
                      description={product.description || undefined}
                    />
                  )
                })}
              </div>
            )}
          </CestasFilters>
        </div>
      </main>
      <Footer />
    </>
  )
}
