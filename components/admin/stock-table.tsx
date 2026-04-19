'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, TrendingUp, TrendingDown, History } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: string
  name: string
  stock: number
  category: {
    name: string
  }
}

interface StockTableProps {
  products: Product[]
}

export function StockTable({ products: initialProducts }: StockTableProps) {
  const [products, setProducts] = useState(initialProducts)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product)
    setDialogOpen(true)
    setQuantity('')
    setReason('')
    setMovementType('ENTRADA')
  }

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      alert('Por favor, preencha a quantidade corretamente')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: movementType,
          quantity: parseInt(quantity),
          reason: reason || 'Ajuste manual',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? { ...p, stock: data.stock } : p))
        )
        setDialogOpen(false)
        setQuantity('')
        setReason('')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao ajustar estoque')
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Erro ao ajustar estoque')
    } finally {
      setLoading(false)
    }
  }

  const handleViewHistory = async (product: Product) => {
    setSelectedProduct(product)
    try {
      const response = await fetch(`/api/admin/products/${product.id}/stock/history`)
      const data = await response.json()
      setHistory(data)
      setHistoryOpen(true)
    } catch (error) {
      console.error('Error fetching history:', error)
      alert('Erro ao buscar histórico')
    }
  }

  const lowStockProducts = products.filter((p) => p.stock < 10)
  const outOfStockProducts = products.filter((p) => p.stock === 0)

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {outOfStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produtos Sem Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
                <p className="text-sm text-red-700 mt-1">Produtos com estoque zerado</p>
              </CardContent>
            </Card>
          )}
          {lowStockProducts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Estoque Baixo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
                <p className="text-sm text-yellow-700 mt-1">Produtos com menos de 10 unidades</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos e Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category.name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            product.stock === 0
                              ? 'bg-red-100 text-red-800'
                              : product.stock < 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.stock} unidades
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(product)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            Histórico
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjustStock(product)}
                          >
                            Ajustar
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

      {/* Dialog de Ajuste */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <Label>Produto</Label>
                <p className="text-sm font-semibold">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">Estoque atual: {selectedProduct.stock} unidades</p>
              </div>

              <div>
                <Label htmlFor="type">Tipo de Movimentação *</Label>
                <Select
                  value={movementType}
                  onValueChange={(value: 'ENTRADA' | 'SAIDA') => setMovementType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Entrada
                      </div>
                    </SelectItem>
                    <SelectItem value="SAIDA">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        Saída
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">Motivo</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Ex: Compra de fornecedor, Ajuste de inventário, etc."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitAdjustment} disabled={loading}>
                  {loading ? 'Salvando...' : 'Confirmar Ajuste'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Histórico de Movimentações - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma movimentação registrada</p>
            ) : (
              history.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {movement.type === 'ENTRADA' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {movement.type === 'ENTRADA' ? 'Entrada' : 'Saída'} de {movement.quantity} unidades
                      </p>
                      <p className="text-sm text-gray-500">{movement.reason || 'Sem motivo especificado'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(movement.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
