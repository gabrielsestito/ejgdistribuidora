'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Scan, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'

const navItems = [
  { href: '/driver', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/entregas', label: 'Entregas', icon: Package },
  { href: '/driver/scanner', label: 'Scanner', icon: Scan },
  { href: '/driver/historico', label: 'Histórico', icon: History },
]

export function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:max-w-6xl md:pb-8">
        <div className="hidden md:flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Painel Entregador</h2>
            <p className="text-sm text-gray-600 mt-1">Gerenciamento de entregas pelo celular</p>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/driver' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
                    isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <main className="mt-6">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/driver' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold',
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
