'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface OrderItem {
  productId: string
  quantity: number
  price: number
}

export function ManualOrderForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [items, setItems] = useState<OrderItem[]>([])
  const [formData, setFormData] = useState({
    userId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    reference: '',
    notes: '',
    paymentMethod: 'DINHEIRO',
  })

  useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.filter((p: any) => p.active)))
      .catch(console.error)

    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.filter((u: any) => u.role === 'CUSTOMER')))
      .catch(console.error)
  }, [])

  // Buscar endereço pelo CEP
  useEffect(() => {
    const fetchAddressByCEP = async () => {
      const cleanZipCode = formData.zipCode.replace(/\D/g, '')
      
      // Só buscar se tiver exatamente 8 dígitos
      if (cleanZipCode.length !== 8) {
        return
      }

      setLoadingCEP(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)
        const data = await response.json()

        if (data.erro) {
          console.log('CEP não encontrado')
          setLoadingCEP(false)
          return
        }

        // Preencher campos automaticamente
        if (data.logradouro || data.bairro || data.localidade || data.uf) {
          setFormData((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }))
        }
      } catch (error) {
        console.error('Error fetching CEP:', error)
      } finally {
        setLoadingCEP(false)
      }
    }

    // Aguardar um pouco após o usuário parar de digitar (debounce)
    const timeoutId = setTimeout(() => {
      fetchAddressByCEP()
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [formData.zipCode])

  const addItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Se mudou o produto, atualizar o preço
      if (field === 'productId') {
        const product = products.find((p) => p.id === value)
        if (product) {
          newItems[index].price = product.price
        }
      }
      
      return newItems
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      alert('Adicione pelo menos um item ao pedido')
      return
    }

    if (!formData.userId && (!formData.customerName || !formData.customerEmail)) {
      alert('Selecione um cliente ou preencha os dados do cliente')
      return
    }

    setLoading(true)

    try {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const shipping = 0 // Frete pode ser adicionado depois
      const total = subtotal + shipping

      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone,
          },
          address: {
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            reference: formData.reference,
          },
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          shipping,
          total,
          userId: formData.userId || undefined,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        router.push('/admin/pedidos')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar pedido')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/pedidos">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Criar Pedido Manual</h1>
              <p className="text-gray-600 mt-1">Crie um pedido para vendas offline ou via WhatsApp</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Dados do Cliente */}
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold">Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="userId" className="text-sm font-medium text-gray-700 mb-2 block">Cliente Cadastrado (Opcional)</Label>
                  <Select
                    value={formData.userId || undefined}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, userId: value }))
                      const user = users.find((u) => u.id === value)
                      if (user) {
                        setFormData((prev) => ({
                          ...prev,
                          customerName: user.name,
                          customerEmail: user.email,
                        }))
                      }
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione um cliente ou preencha manualmente abaixo" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.userId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          userId: '',
                          customerName: '',
                          customerEmail: '',
                        }))
                      }}
                    >
                      Limpar seleção
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium text-gray-700 mb-2 block">Nome *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                    required
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail" className="text-sm font-medium text-gray-700 mb-2 block">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    required
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700 mb-2 block">Telefone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold">Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <div className="relative">
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '')
                        if (value.length > 8) value = value.slice(0, 8)
                        if (value.length > 5) {
                          value = value.slice(0, 5) + '-' + value.slice(5)
                        }
                        setFormData((prev) => ({ ...prev, zipCode: value }))
                      }}
                      onBlur={async () => {
                        const cleanZipCode = formData.zipCode.replace(/\D/g, '')
                        if (cleanZipCode.length === 8 && !loadingCEP) {
                          setLoadingCEP(true)
                          try {
                            const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)
                            const data = await response.json()

                            if (!data.erro && (data.logradouro || data.bairro || data.localidade || data.uf)) {
                              setFormData((prev) => ({
                                ...prev,
                                street: data.logradouro || prev.street,
                                neighborhood: data.bairro || prev.neighborhood,
                                city: data.localidade || prev.city,
                                state: data.uf || prev.state,
                              }))
                            }
                          } catch (error) {
                            console.error('Error fetching CEP:', error)
                          } finally {
                            setLoadingCEP(false)
                          }
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                      className="h-11"
                    />
                    {loadingCEP && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.zipCode.length === 9 && !loadingCEP && formData.street && 'Endereço preenchido automaticamente'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      maxLength={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itens do Pedido */}
          <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Itens do Pedido</CardTitle>
                <Button type="button" onClick={addItem} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 mb-2">Nenhum item adicionado</p>
                  <p className="text-sm text-gray-400">Clique em "Adicionar Item" para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId)
                    return (
                      <div key={index} className="p-5 border border-gray-200 rounded-lg space-y-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900">Item {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Produto *</Label>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updateItem(index, 'productId', value)}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((prod) => (
                                  <SelectItem key={prod.id} value={prod.id}>
                                    {prod.name} - {formatPrice(prod.price)} (Estoque: {prod.stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Quantidade *</Label>
                            <Input
                              type="number"
                              min="1"
                              max={product?.stock || 0}
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              required
                              className="h-11"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Preço Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                              required
                              className="h-11"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">
                            Subtotal: <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo e Observações */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold">Observações</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <textarea
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o pedido..."
                />
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700 mb-2 block">Forma de Pagamento</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="CARTAO">Cartão</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frete</span>
                    <span>R$ 0,00</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-11"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || items.length === 0} className="h-11 min-w-[140px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Pedido'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
