import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MainLayout } from '@/components/layout/main-layout'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product/product-card'
import { BannerCarousel } from '@/components/layout/banner-carousel'
import { CategoriesCarousel } from '@/components/layout/categories-carousel'
import { Button } from '@/components/ui/button'
import { formatPrice, parseImages } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

export default async function Home() {
  // Banner principal (menor, em cima)
  const mainBanner = await prisma.banner.findFirst({
    where: { active: true, isMain: true },
    orderBy: { order: 'asc' },
  })

  // Banners para o carousel (não são principais)
  const carouselBanners = await prisma.banner.findMany({
    where: { active: true, isMain: false },
    orderBy: { order: 'asc' },
  })

  // Categorias para o carousel "Navegue pelas categorias"
  const carouselCategories = await prisma.category.findMany({
    where: { active: true, showInMenu: true },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
    take: 12,
  })

  // Produtos em destaque (destaque do dia)
  const featuredProducts = await prisma.product.findMany({
    where: { active: true, featured: true },
    include: { category: true },
    take: 12,
    orderBy: { createdAt: 'desc' },
  })

  // Produtos para promoções (últimos produtos)
  const promotionProducts = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    take: 6,
    orderBy: { createdAt: 'desc' },
  })

  const displayedFeaturedProducts =
    featuredProducts.length > 0 ? featuredProducts : promotionProducts
  const showPromotions = featuredProducts.length > 0 && promotionProducts.length > 0

  return (
    <>
      <MainLayout>
        {/* Banner Principal (menor, em cima) */}
        {mainBanner && mainBanner.image && (
          <section className="w-full">
            <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-5">
              <Link href={mainBanner.link || '#'} className="block">
                <div className="relative w-full h-20 sm:h-24 md:h-32 lg:h-40 flex items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden">
                  {mainBanner.image.endsWith('.gif') || mainBanner.image.includes('.gif') ? (
                    <img
                      src={mainBanner.image}
                      alt={mainBanner.title}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl sm:rounded-2xl"
                    />
                  ) : (
                    <Image
                      src={mainBanner.image}
                      alt={mainBanner.title}
                      fill
                      className="object-contain rounded-xl sm:rounded-2xl"
                      sizes="100vw"
                      priority
                    />
                  )}
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Banner Carousel */}
        {carouselBanners.length > 0 && (
          <section className="bg-gradient-to-b from-white via-gray-50 to-white py-2">
            <BannerCarousel banners={carouselBanners} />
          </section>
        )}



        {/* Navegue pelas Categorias */}
        {carouselCategories.length > 0 && (
          <section className="py-10 bg-gradient-to-b from-white via-blue-50/40 to-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Navegue pelas categorias
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Escolha por tipo e monte sua compra</p>
                </div>
              </div>
              <div className="rounded-3xl border border-blue-100/60 shadow-sm p-4 md:p-5 bg-white/80">
                <CategoriesCarousel categories={carouselCategories} />
              </div>
            </div>
          </section>
        )}

        {/* Destaques do Dia */}
        {displayedFeaturedProducts.length > 0 && (
          <section className="py-10 bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Destaques do dia
                  </h2>
                  <p className="text-gray-600 text-sm">Confira as ofertas selecionadas</p>
                </div>
                <Button asChild variant="ghost" className="text-primary">
                  <Link href="/cestas">
                    Ver mais
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {displayedFeaturedProducts.map((product) => {
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
            </div>
          </section>
        )}

        {/* Seção de Promoções */}
        {showPromotions && (
          <section className="py-10 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Ofertas Especiais
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Últimos produtos com preço especial</p>
                </div>
                <Button asChild variant="ghost" className="text-primary">
                  <Link href="/cestas">
                    Ver mais
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {promotionProducts.map((product) => {
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
            </div>
          </section>
        )}
      </MainLayout>
      <Footer />
    </>
  )
}
