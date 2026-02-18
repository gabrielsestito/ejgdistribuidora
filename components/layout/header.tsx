'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { ShoppingCart, Search, Menu, X, Package, Heart, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/contexts/cart-context'
import { useFavorites } from '@/contexts/favorites-context'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { FavoritesDrawer } from '@/components/layout/favorites-drawer'
import { useRouter } from 'next/navigation'
import { DepartmentMenu } from '@/components/layout/department-menu'
import { UserMenu } from '@/components/layout/user-menu'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session } = useSession()
  const { itemCount } = useCart()
  const { favoritesCount } = useFavorites()
  const router = useRouter()
  const [cartOpen, setCartOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentMenuOpen, setDepartmentMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [navLinks, setNavLinks] = useState<Array<{ id: string; label: string; link: string; iconUrl?: string }>>([])
  const [loadingLinks, setLoadingLinks] = useState(false)

  useEffect(() => {
    setLoadingLinks(true)
    fetch('/api/nav-links')
      .then((res) => res.json())
      .then((data) => {
        setNavLinks(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoadingLinks(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/cestas?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="container mx-auto px-4">
          {/* Main Navigation */}
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 group">
              <div className="relative h-12 w-40 md:h-14 md:w-44">
                {logoError ? (
                  <Package className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                ) : (
                  <Image
                    src="/logo.png"
                    alt="EJG Distribuidora"
                    fill
                    priority
                    className="object-contain"
                    sizes="(max-width: 768px) 120px, 160px"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
            </Link>


            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:block">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Estou buscando..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-20 h-10 bg-white/90 shadow-sm focus:ring-2 focus:ring-primary transition-all"
                />
                <Button
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-4 hover:scale-105 transition-transform"
                >
                  Buscar
                </Button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex relative hover:scale-110 transition-transform"
                onClick={() => setFavoritesOpen(true)}
              >
                <Heart className={cn(
                  'h-5 w-5 transition-colors',
                  favoritesCount > 0 && 'fill-primary text-primary'
                )} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold animate-bounce">
                    {favoritesCount}
                  </span>
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="relative hover:scale-110 transition-transform"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold animate-bounce">
                    {itemCount}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              {session ? (
                <UserMenu />
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="hover:scale-105 transition-transform">
                    <Link href="/conta/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="hover:scale-105 transition-transform">
                    <Link href="/conta/registro">Registrar</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Navigation Bar - Submenu with Categories */}
            <div className="hidden md:flex h-14 items-center gap-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-t border-primary/10 px-6 relative rounded-b-2xl">
            <div className="relative">
              <Button
                variant="ghost"
                className={cn(
                    'flex items-center gap-2 h-11 px-4 rounded-full text-sm font-semibold transition-all border border-transparent hover:border-primary/20 hover:bg-white/80',
                  departmentMenuOpen
                    ? 'text-primary'
                    : 'text-gray-700 hover:text-primary'
                )}
                onClick={() => setDepartmentMenuOpen(!departmentMenuOpen)}
              >
                <Menu className="h-5 w-5" />
                <span>Compre por Departamento</span>
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  departmentMenuOpen && 'rotate-180'
                )} />
              </Button>
              <DepartmentMenu open={departmentMenuOpen} onOpenChange={setDepartmentMenuOpen} />
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-4">
                {navLinks.length === 0 && !loadingLinks && (
                  <span className="text-sm text-gray-500">Adicione itens no Admin › Submenu</span>
                )}
                {navLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-primary hover:bg-white/80 border border-transparent hover:border-primary/20 transition-all"
                  >
                    {item.iconUrl ? (
                      <Image
                        src={item.iconUrl}
                        alt={item.label}
                        width={22}
                        height={22}
                        className="rounded"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-primary" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white/95 py-4 shadow-lg backdrop-blur animate-in slide-in-from-top">
              <form
                onSubmit={(e) => {
                  handleSearch(e)
                  setMobileMenuOpen(false)
                }}
                className="px-4 pb-3"
              >
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Estou buscando..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-20 h-10 bg-white shadow-sm focus:ring-2 focus:ring-primary transition-all"
                  />
                  <Button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3"
                  >
                    Buscar
                  </Button>
                </div>
              </form>
              <nav className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className="justify-start rounded-lg"
                  onClick={() => {
                    setDepartmentMenuOpen(!departmentMenuOpen)
                    setMobileMenuOpen(false)
                  }}
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Compre por Departamento
                </Button>
                <Link
                  href="/cestas"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cestas Básicas
                </Link>
                {!session && (
                  <>
                    <Link
                      href="/conta/login"
                      className="px-4 py-2 text-sm font-medium text-primary hover:bg-gray-50 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/conta/registro"
                      className="px-4 py-2 text-sm font-medium text-primary hover:bg-gray-50 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Registrar
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <FavoritesDrawer open={favoritesOpen} onOpenChange={setFavoritesOpen} />
    </>
  )
}
