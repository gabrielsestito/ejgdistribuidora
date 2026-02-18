'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'

interface Category {
  id: string
  name: string
  slug: string
  active: boolean
  showInMenu?: boolean
  _count: {
    products: number
  }
}

interface CategoriesTableProps {
  categories: Category[]
}

export function CategoriesTable({ categories: initialCategories }: CategoriesTableProps) {
  const [categories, setCategories] = useState(initialCategories)

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    // Atualizar imediatamente para feedback instantâneo
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c))
    )

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!response.ok) {
        // Reverter se falhou
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, active: currentActive } : c))
        )
      }
    } catch (error) {
      console.error('Error toggling category:', error)
      // Reverter se falhou
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: currentActive } : c))
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-semibold text-gray-900">Nome</TableHead>
                <TableHead className="font-semibold text-gray-900">Slug</TableHead>
                <TableHead className="font-semibold text-gray-900">Produtos</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">No Menu</TableHead>
                <TableHead className="text-right font-semibold text-gray-900">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    Nenhuma categoria encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <Link
                        href={`/admin/categorias/${category.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {category.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{category.slug}</TableCell>
                    <TableCell className="text-gray-600">{category._count.products}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {category.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={async () => {
                          const previousValue = category.showInMenu
                          // Atualizar imediatamente
                          setCategories((prev) =>
                            prev.map((c) => (c.id === category.id ? { ...c, showInMenu: !previousValue } : c))
                          )
                          
                          try {
                            const response = await fetch(`/api/admin/categories/${category.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ showInMenu: !previousValue }),
                            })
                            
                            if (!response.ok) {
                              // Reverter se falhou
                              setCategories((prev) =>
                                prev.map((c) => (c.id === category.id ? { ...c, showInMenu: previousValue } : c))
                              )
                            }
                          } catch (error) {
                            console.error('Error updating showInMenu:', error)
                            // Reverter se falhou
                            setCategories((prev) =>
                              prev.map((c) => (c.id === category.id ? { ...c, showInMenu: previousValue } : c))
                            )
                          }
                        }}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          category.showInMenu
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category.showInMenu ? 'Sim' : 'Não'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(category.id, category.active)}
                        >
                          {category.active ? (
                            <EyeOff className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-600" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/admin/categorias/${category.id}`}>
                            <Edit className="h-4 w-4 text-gray-600" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
