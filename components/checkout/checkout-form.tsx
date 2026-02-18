'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/contexts/cart-context'
import { formatPrice } from '@/lib/utils'
import { CheckoutSteps } from './checkout-steps'
import { Loader2, AlertCircle, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AddToCartButton } from '@/components/product/add-to-cart-button'

const DEFAULT_MIN_ORDER = 50

const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
})

const addressSchema = z.object({
  street: z.string().min(3, 'Rua inválida'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro inválido'),
  city: z.string().min(2, 'Cidade inválida'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zipCode: z.string().min(8, 'CEP inválido'),
  reference: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>
type AddressFormData = z.infer<typeof addressSchema>

interface CheckoutFormProps {
  user?: {
    id: string
    email: string
    name: string
  }
}

export function CheckoutForm({ user }: CheckoutFormProps) {
  const searchParams = useSearchParams()
  const { items, total, clearCart } = useCart()
  const [step, setStep] = useState(1)
  const [minOrder, setMinOrder] = useState<number>(DEFAULT_MIN_ORDER)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'redirecting' | 'success' | 'pending' | 'failure'
  >('idle')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [shippingPrice, setShippingPrice] = useState<number | null>(null)
  const [shippingDistance, setShippingDistance] = useState<number | null>(null)
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [shippingAvailable, setShippingAvailable] = useState<boolean | null>(null)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [shippingDetails, setShippingDetails] = useState<{
    freeShipping?: boolean
    freeCity?: { city: string; state: string }
    message?: string
  } | null>(null)
  const [recommendations, setRecommendations] = useState<Array<{
    id: string
    name: string
    slug: string
    description?: string | null
    price: number
    originalPrice?: number | null
    images: string[]
  }>>([])
  const [loadingRecs, setLoadingRecs] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        if (typeof data?.minOrderAmount === 'number') {
          setMinOrder(data.minOrderAmount)
        }
      } catch {
        // fallback
      }
    }
    loadConfig()
  }, [])

  const customerForm = useForm<CustomerFormData>({
    defaultValues: user
      ? {
          name: user.name,
          email: user.email,
          phone: '',
        }
      : {},
  })

  const addressForm = useForm<AddressFormData>({})

  // Buscar endereço pelo CEP
  const fetchAddressByCEP = async (zipCode: string) => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    
    if (cleanZipCode.length !== 8) {
      return
    }

    setLoadingCEP(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)
      const data = await response.json()

      if (data.erro) {
        setLoadingCEP(false)
        return
      }

      // Preencher campos automaticamente
      addressForm.setValue('street', data.logradouro || '')
      addressForm.setValue('neighborhood', data.bairro || '')
      addressForm.setValue('city', data.localidade || '')
      addressForm.setValue('state', data.uf || '')
      
      // Limpar erros
      addressForm.clearErrors('street')
      addressForm.clearErrors('neighborhood')
      addressForm.clearErrors('city')
      addressForm.clearErrors('state')
    } catch (error) {
      console.error('Error fetching CEP:', error)
    } finally {
      setLoadingCEP(false)
    }
  }

  // Calcular frete quando CEP for preenchido
  const calculateShipping = async (zipCode: string) => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    
    if (cleanZipCode.length < 8) {
      setShippingPrice(null)
      setShippingError(null)
      setShippingAvailable(null)
      return
    }

    setCalculatingShipping(true)
    setShippingError(null)

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: cleanZipCode, subtotal: total }),
      })

      const data = await response.json()

      if (!response.ok) {
        setShippingError(data.message || data.error || 'Erro ao calcular frete')
        setShippingAvailable(false)
        setShippingPrice(null)
        setShippingDetails(null)
        return
      }

      setShippingPrice(data.shippingPrice)
      setShippingDistance(data.distance)
      setShippingAvailable(true)
      setShippingError(null)
      setShippingDetails({
        freeShipping: Boolean(data.freeShipping),
        freeCity: data.freeCity,
        message: data.message,
      })
    } catch (error) {
      console.error('Error calculating shipping:', error)
      setShippingError('Erro ao calcular frete. Tente novamente.')
      setShippingAvailable(false)
      setShippingDetails(null)
    } finally {
      setCalculatingShipping(false)
    }
  }

  // Observar mudanças no CEP
  const zipCode = addressForm.watch('zipCode')
  useEffect(() => {
    if (zipCode) {
      const cleanZipCode = zipCode.replace(/\D/g, '')
      
      // Buscar endereço quando CEP estiver completo
      if (cleanZipCode.length === 8) {
        fetchAddressByCEP(zipCode)
        
        // Calcular frete após um delay
        const timeoutId = setTimeout(() => {
          calculateShipping(zipCode)
        }, 500)
        return () => clearTimeout(timeoutId)
      } else {
        // Limpar dados se CEP incompleto
        setShippingPrice(null)
        setShippingError(null)
        setShippingAvailable(null)
      }
    }
  }, [zipCode])

  const paymentQueryStatus = searchParams.get('status')
  const orderQueryCode = searchParams.get('order')
  const orderQueryId = searchParams.get('orderId')

  useEffect(() => {
    if (!paymentQueryStatus) return

    setStep(4)
    if (orderQueryCode) {
      setOrderCode(orderQueryCode)
    }
    if (orderQueryId) {
      setOrderId(orderQueryId)
    }

    if (paymentQueryStatus === 'success') {
      setPaymentStatus('success')
      clearCart()
      return
    }

    if (paymentQueryStatus === 'pending') {
      setPaymentStatus('pending')
      return
    }

    if (paymentQueryStatus === 'failure') {
      setPaymentStatus('failure')
    }
  }, [paymentQueryStatus, orderQueryCode, orderQueryId, clearCart])

  useEffect(() => {
    const loadRecs = async () => {
      if (!items.length) {
        setRecommendations([])
        return
      }
      setLoadingRecs(true)
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: items.map((i) => i.id), limit: 8 }),
        })
        const data = await res.json()
        setRecommendations(Array.isArray(data) ? data : [])
      } catch {
        setRecommendations([])
      } finally {
        setLoadingRecs(false)
      }
    }
    loadRecs()
  }, [items])

  const onCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = customerForm.getValues()
    try {
      customerSchema.parse(data)
      setStep(2)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          customerForm.setError(err.path[0] as any, { message: err.message })
        })
      }
    }
  }

  const onAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = addressForm.getValues()
    
    // Verificar se o frete está disponível
    if (!shippingAvailable || shippingPrice === null) {
      alert('Por favor, aguarde o cálculo do frete ou verifique se o CEP está dentro da área de entrega.')
      return
    }

    try {
      addressSchema.parse(data)
      setStep(3)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          addressForm.setError(err.path[0] as any, { message: err.message })
        })
      }
    }
  }

  const redirectToPayment = async (orderIdValue: string) => {
    const paymentResponse = await fetch('/api/payments/mercadopago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderIdValue,
      }),
    })
    const paymentText = await paymentResponse.text()
    let paymentJson: any = null
    try {
      paymentJson = paymentText ? JSON.parse(paymentText) : null
    } catch {
      paymentJson = null
    }
    if (!paymentResponse.ok) {
      const message =
        (paymentJson && (paymentJson.error || paymentJson.message)) ||
        paymentText ||
        'Erro ao iniciar pagamento'
      throw new Error(message)
    }
    const paymentData = paymentJson || {}
    setPaymentUrl(paymentData.initPoint || null)
    if (paymentData.initPoint) {
      window.location.href = paymentData.initPoint
      return
    }
    throw new Error('Não foi possível iniciar o pagamento')
  }

  const onConfirmOrder = async () => {
    const customerData = customerForm.getValues()
    const addressData = addressForm.getValues()

    if (!shippingAvailable || shippingPrice === null) {
      alert('Por favor, verifique o cálculo do frete antes de confirmar o pedido.')
      return
    }

    if (total < minOrder) {
      alert(`Pedido mínimo é R$ ${minOrder.toFixed(2)}`)
      return
    }

    try {
      setPaymentStatus('redirecting')
      setStep(4)
      setPaymentUrl(null)
      const finalTotal = total + shippingPrice

      const payload: any = {
        customer: customerData,
        address: addressData,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod: 'MERCADO_PAGO',
        subtotal: total,
        shipping: shippingPrice,
        total: finalTotal,
        zipCode: addressData.zipCode.replace(/\D/g, ''),
      }
      if (shippingDistance !== null) {
        payload.distance = shippingDistance
      }
      const response = await fetch('/api/checkout/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responseText = await response.text()
      let responseJson: any = null
      try {
        responseJson = responseText ? JSON.parse(responseText) : null
      } catch {
        responseJson = null
      }
      if (!response.ok) {
        const message =
          (responseJson && (responseJson.error || responseJson.message)) ||
          responseText ||
          'Erro ao criar pedido'
        throw new Error(message)
      }
      const data = responseJson || {}
      setOrderCode(data.orderCode)
      setOrderId(data.orderId)
      setPaymentUrl(data.initPoint || null)
      if (data.initPoint) {
        window.location.href = data.initPoint
        return
      }
      throw new Error('Não foi possível iniciar o pagamento')
    } catch (error: any) {
      console.error(error)
      setPaymentStatus('idle')
      setStep(3)
      alert(error.message || 'Erro ao finalizar pedido. Tente novamente.')
    }
  }

  const onRetryPayment = async () => {
    if (!orderId) return
    try {
      setPaymentStatus('redirecting')
      setStep(4)
      setPaymentUrl(null)
      await redirectToPayment(orderId)
    } catch (error: any) {
      console.error(error)
      setPaymentStatus('failure')
      alert(error.message || 'Erro ao iniciar pagamento. Tente novamente.')
    }
  }

  const finalTotal = shippingPrice !== null ? total + shippingPrice : total

  if (step === 4) {
    const showCode = Boolean(orderCode)

    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {paymentStatus === 'redirecting' && (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            )}
            {paymentStatus === 'success' && (
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {(paymentStatus === 'pending' || paymentStatus === 'failure') && (
              <AlertCircle className="h-8 w-8 text-primary" />
            )}
          </div>

          {paymentStatus === 'redirecting' && (
            <>
              <h2 className="text-3xl font-bold mb-3">Indo para o pagamento</h2>
              <p className="text-gray-600 mb-6">
                Estamos redirecionando para o Mercado Pago.
              </p>
            </>
          )}

          {paymentStatus === 'success' && (
            <>
              <h2 className="text-3xl font-bold mb-3">Pagamento confirmado!</h2>
              <p className="text-gray-600 mb-6">
                Seu pedido foi confirmado com sucesso.
              </p>
            </>
          )}

          {paymentStatus === 'pending' && (
            <>
              <h2 className="text-3xl font-bold mb-3">Pagamento pendente</h2>
              <p className="text-gray-600 mb-6">
                O pagamento ainda está sendo processado. Você pode acompanhar o pedido.
              </p>
            </>
          )}

          {paymentStatus === 'failure' && (
            <>
              <h2 className="text-3xl font-bold mb-3">Pagamento não aprovado</h2>
              <p className="text-gray-600 mb-6">
                O pagamento falhou. Volte para revisar e tentar novamente.
              </p>
            </>
          )}

          {showCode && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Código do Pedido</p>
              <p className="text-2xl font-bold text-primary">{orderCode}</p>
            </div>
          )}

          <div className="space-y-3">
            {showCode && (
              <Button asChild className="w-full" size="lg">
                <a href={`/acompanhar?code=${orderCode}`}>Acompanhar Pedido</a>
              </Button>
            )}
            {paymentStatus === 'redirecting' && paymentUrl && (
              <Button asChild variant="outline" className="w-full">
                <a href={paymentUrl}>Abrir pagamento</a>
              </Button>
            )}
            {(paymentStatus === 'failure' || paymentStatus === 'pending') && orderId && (
              <Button className="w-full" onClick={onRetryPayment}>
                Tentar pagamento novamente
              </Button>
            )}
            {(paymentStatus === 'failure' || paymentStatus === 'pending') && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPaymentStatus('idle')
                  setStep(3)
                }}
              >
                Voltar para revisão
              </Button>
            )}
            {paymentStatus === 'success' && (
              <Button asChild variant="outline" className="w-full">
                <a href="/cestas">Continuar Comprando</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CheckoutSteps currentStep={step} />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && 'Dados do Cliente'}
                {step === 2 && 'Endereço de Entrega'}
                {step === 3 && 'Revisão do Pedido'}
                {step === 4 && 'Pagamento'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 && (
              <form
                onSubmit={onCustomerSubmit}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    {...customerForm.register('name')}
                    error={customerForm.formState.errors.name?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...customerForm.register('email')}
                    error={customerForm.formState.errors.email?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...customerForm.register('phone')}
                    error={customerForm.formState.errors.phone?.message}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Continuar
                </Button>
              </form>
            )}

              {step === 2 && (
              <form
                onSubmit={onAddressSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        {...addressForm.register('zipCode')}
                        error={addressForm.formState.errors.zipCode?.message}
                        placeholder="00000-000"
                        maxLength={9}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2')
                          addressForm.setValue('zipCode', formatted)
                        }}
                        className="pr-10"
                      />
                      {loadingCEP && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    {calculatingShipping && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculando frete...
                      </p>
                    )}
                    {shippingError && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{shippingError}</p>
                      </div>
                    )}
                    {shippingAvailable && shippingPrice !== null && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✓ Frete disponível! Distância: {shippingDistance?.toFixed(1)}km - Valor: {formatPrice(shippingPrice)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      {...addressForm.register('street')}
                      error={addressForm.formState.errors.street?.message}
                      placeholder="Digite o CEP para preencher automaticamente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      {...addressForm.register('number')}
                      error={addressForm.formState.errors.number?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      {...addressForm.register('complement')}
                      placeholder="Apto, Bloco, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      {...addressForm.register('neighborhood')}
                      error={addressForm.formState.errors.neighborhood?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      {...addressForm.register('city')}
                      error={addressForm.formState.errors.city?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado (UF) *</Label>
                    <Input
                      id="state"
                      maxLength={2}
                      {...addressForm.register('state')}
                      error={addressForm.formState.errors.state?.message}
                      placeholder="SP"
                      className="uppercase"
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        addressForm.setValue('state', value)
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="reference">Ponto de Referência</Label>
                    <Textarea
                      id="reference"
                      {...addressForm.register('reference')}
                      placeholder="Ex: Próximo ao mercado, em frente à escola..."
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={!shippingAvailable || shippingPrice === null || calculatingShipping}
                  >
                    {calculatingShipping ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      'Continuar'
                    )}
                  </Button>
                </div>
              </form>
            )}

              {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Dados do Cliente</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>{customerForm.getValues('name')}</p>
                    <p className="text-sm text-gray-600">
                      {customerForm.getValues('email')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {customerForm.getValues('phone')}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>
                      {addressForm.getValues('street')},{' '}
                      {addressForm.getValues('number')}
                    </p>
                    {addressForm.getValues('complement') && (
                      <p>{addressForm.getValues('complement')}</p>
                    )}
                    <p>
                      {addressForm.getValues('neighborhood')} -{' '}
                      {addressForm.getValues('city')}/{addressForm.getValues('state')}
                    </p>
                    <p>CEP: {addressForm.getValues('zipCode')}</p>
                    {shippingDetails?.freeShipping && shippingDetails.freeCity && (
                      <p className="text-sm text-green-700 mt-1">
                        {shippingDetails.message || `Frete grátis para ${shippingDetails.freeCity.city}/${shippingDetails.freeCity.state}`}
                      </p>
                    )}
                    {shippingDistance && (
                      <p className="text-sm text-gray-500 mt-1">
                        Distância: {shippingDistance.toFixed(1)}km de Ribeirão Preto
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  {total < minOrder && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        Pedido mínimo é R$ {minOrder.toFixed(2)}. Adicione mais itens para continuar.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button onClick={onConfirmOrder} className="flex-1" disabled={total < minOrder}>
                    Ir para pagamento
                  </Button>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frete</span>
                  <span>
                    {calculatingShipping ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : shippingDetails?.freeShipping ? (
                      <span className="text-green-700 font-semibold">Frete grátis</span>
                    ) : shippingPrice !== null ? (
                      formatPrice(shippingPrice)
                    ) : (
                      <span className="text-gray-500">Digite o CEP</span>
                    )}
                  </span>
                </div>
                {shippingDistance && (
                  <p className="text-xs text-gray-500">
                    Distância: {shippingDistance.toFixed(1)}km
                  </p>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">
                    {shippingPrice !== null
                      ? formatPrice(finalTotal)
                      : formatPrice(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {recommendations.length > 0 && (
        <div className="container mx-auto px-4">
          <Card className="mt-10">
            <CardHeader>
              <CardTitle className="text-2xl">Produtos semelhantes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecs ? (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando recomendações...
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recommendations.slice(0, 8).map((p) => (
                    <div key={p.id} className="border rounded-lg overflow-hidden bg-white h-full flex flex-col">
                      <Link href={`/cestas/${p.slug}`}>
                        <div className="relative w-full h-44 bg-gray-100">
                          <Image
                            src={p.images?.[0] || '/placeholder.png'}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>
                      <div className="p-4 flex-1 flex flex-col">
                        <Link href={`/cestas/${p.slug}`}>
                          <h3 className="font-semibold text-base hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                            {p.name}
                          </h3>
                        </Link>
                        <div className="mt-2 space-y-3">
                          <span className="text-primary font-bold block">{formatPrice(p.price)}</span>
                          <AddToCartButton
                            product={{
                              id: p.id,
                              name: p.name,
                              slug: p.slug,
                              price: p.price,
                              image: p.images?.[0],
                            }}
                            quantity={1}
                            className="w-full h-10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
