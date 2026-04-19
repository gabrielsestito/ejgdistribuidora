'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Bell, Clock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/documentos', label: 'Documentos', icon: FileText },
  { href: '/employee/avisos', label: 'Avisos', icon: Bell },
  { href: '/employee/horarios', label: 'Horários', icon: Clock },
]

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Painel do Funcionário</h1>
                <p className="text-gray-600 mt-1">Acesse seus documentos e informações do RH</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>

            <nav className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <div className="flex flex-wrap gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>

          <div className="mt-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
