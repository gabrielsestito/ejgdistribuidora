'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/cart-context'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CheckoutPage() {
  const { items } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setStatus(params.get('status'))
      setOrderCode(params.get('order'))
      setOrderId(params.get('orderId'))
    }
  }, [])

  useEffect(() => {
    if (items.length === 0 && !status) {
      router.push('/carrinho')
    }
  }, [items.length, status, router])

  useEffect(() => {
    let interval: any
    const fetchOrder = async () => {
      if (!orderCode) return
      try {
        setLoadingOrder(true)
        const res = await fetch(`/api/orders/${orderCode}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data)
        }
      } finally {
        setLoadingOrder(false)
      }
    }
    if (status && orderCode) {
      fetchOrder()
      let attempts = 0
      interval = setInterval(async () => {
        attempts += 1
        await fetchOrder()
        if (attempts >= 10 || (order && order.paymentStatus === 'PAGO')) {
          clearInterval(interval)
        }
      }, 4000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status, orderCode])

  if (items.length === 0 && !status) {
    return null
  }

  const renderPaymentStatus = () => {
    const paymentStatus = order?.paymentStatus || (status === 'success' ? 'PENDENTE' : status?.toUpperCase())
    const isPaid = paymentStatus === 'PAGO'
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {isPaid ? 'Pagamento confirmado' : 'Pagamento pendente'}
              </h1>
              <p className="text-gray-600">
                {isPaid
                  ? 'Recebemos o seu pagamento e vamos prosseguir com o processamento do pedido.'
                  : 'Estamos aguardando a confirmação do pagamento. Caso já tenha pago, aguarde alguns instantes.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-sm text-gray-600">Pedido</p>
                <p className="font-semibold">{order?.code || orderCode || '-'}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border">
                <p className="text-sm text-gray-600">Status do pagamento</p>
                <p className={`font-semibold ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
                  {isPaid ? 'Pago' : 'Pendente'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href={`/acompanhar?code=${order?.code || orderCode || ''}`}>Acompanhar pedido</Link>
              </Button>
              <Button onClick={() => {
                if (orderCode) {
                  setLoadingOrder(true)
                  fetch(`/api/orders/${orderCode}`).then(async (r) => {
                    if (r.ok) setOrder(await r.json())
                  }).finally(() => setLoadingOrder(false))
                }
              }} disabled={loadingOrder}>
                {loadingOrder ? 'Atualizando...' : 'Atualizar status'}
              </Button>
              <Button asChild>
                <Link href="/">Voltar à loja</Link>
              </Button>
            </div>
            {!isPaid && (
              <p className="text-xs text-gray-500 text-center">
                A confirmação pode levar alguns instantes. Você receberá um e‑mail quando o pagamento for aprovado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {!status ? (
              <>
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                <CheckoutForm user={session?.user} />
              </>
            ) : (
              renderPaymentStatus()
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
