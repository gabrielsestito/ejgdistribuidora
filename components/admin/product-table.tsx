'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice, cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'

interface Product {
  id: string
  name: string
  slug: string
  price: any
  stock: number
  active: boolean
  featured?: boolean
  category: {
    name: string
  }
}

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  const [productList, setProductList] = useState(products)

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    // Atualizar imediatamente para feedback instantâneo
    setProductList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
    )

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!response.ok) {
        // Reverter se falhou
        setProductList((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: currentActive } : p))
        )
      }
    } catch (error) {
      console.error('Error toggling product:', error)
      // Reverter se falhou
      setProductList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: currentActive } : p))
      )
    }
  }

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    // Atualizar imediatamente para feedback instantâneo
    setProductList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !currentFeatured } : p))
    )

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !currentFeatured }),
      })

      if (!response.ok) {
        // Reverter se falhou
        setProductList((prev) =>
          prev.map((p) => (p.id === id ? { ...p, featured: currentFeatured } : p))
        )
      }
    } catch (error) {
      console.error('Error toggling featured:', error)
      // Reverter se falhou
      setProductList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, featured: currentFeatured } : p))
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProductList((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-semibold text-gray-900">Produto</TableHead>
                <TableHead className="font-semibold text-gray-900">Categoria</TableHead>
                <TableHead className="font-semibold text-gray-900">Preço</TableHead>
                <TableHead className="font-semibold text-gray-900">Estoque</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Destaque</TableHead>
                <TableHead className="text-right font-semibold text-gray-900">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                productList.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <Link
                        href={`/admin/produtos/${product.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600">{product.category.name}</TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatPrice(Number(product.price))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : product.stock < 10
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleFeatured(product.id, product.featured || false)}
                      >
                        <Star
                          className={cn(
                            'h-4 w-4',
                            product.featured
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-400'
                          )}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(product.id, product.active)}
                        >
                          {product.active ? (
                            <EyeOff className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-600" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/admin/produtos/${product.id}`}>
                            <Edit className="h-4 w-4 text-gray-600" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(product.id)}
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
