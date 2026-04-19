'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, Package, Settings, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  if (!session) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2"
      >
        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
          {session.user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="hidden md:block font-medium">{session.user.name}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50 py-1">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/conta"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4" />
                Meu Perfil
              </Link>
              <Link
                href="/conta/pedidos"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <Package className="h-4 w-4" />
                Meus Pedidos
              </Link>
              <Link
                href="/conta/configuracoes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t"
                >
                  <Settings className="h-4 w-4" />
                  Painel Admin
                </Link>
              )}
              {session.user.role === 'DRIVER' && (
                <Link
                  href="/driver"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t"
                >
                  <Package className="h-4 w-4" />
                  Painel Entregador
                </Link>
              )}
              {session.user.role === 'EMPLOYEE' && (
                <Link
                  href="/employee"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t"
                >
                  <User className="h-4 w-4" />
                  Painel Funcionário
                </Link>
              )}
            </div>
            <div className="border-t py-1">
              <button
                onClick={() => {
                  signOut()
                  setOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
